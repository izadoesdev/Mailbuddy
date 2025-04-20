import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { extractContentFromParts } from "@/libs/utils/email-content";
import { encodeEncryptedData, encryptText } from "@/libs/utils/encryption";
import type { GaxiosResponse } from "gaxios";
import type { gmail_v1 } from "googleapis";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { withGmailApi } from "../utils/withGmail";

// Constants
const GMAIL_USER_ID = "me";
const MAX_USERS_PER_RUN = 10;
const SYNC_BATCH_SIZE = 50;
const MAX_HISTORY_RESULTS = 500;
const FULL_SYNC_BATCH_SIZE = 500; // For full initial sync

// Helper for logging
const log = (message: string, ...args: any[]) => {
    console.log(`[Background Sync] ${message}`, ...args);
};

/**
 * Encrypt email fields for database storage
 */
function encryptEmailFields(emailData: any) {
    // Encrypt body
    const {
        encryptedData: encryptedBodyData,
        iv: bodyIv,
        authTag: bodyAuthTag,
    } = encryptText(emailData.body);
    const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);

    // Encrypt subject
    const {
        encryptedData: encryptedSubjectData,
        iv: subjectIv,
        authTag: subjectAuthTag,
    } = encryptText(emailData.subject);
    const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);

    // Encrypt snippet if it exists
    let encryptedSnippet = null;
    if (emailData.snippet) {
        const {
            encryptedData: encryptedSnippetData,
            iv: snippetIv,
            authTag: snippetAuthTag,
        } = encryptText(emailData.snippet);
        encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);
    }

    // Return encrypted email
    return {
        ...emailData,
        body: encryptedBody,
        subject: encryptedSubject,
        snippet: encryptedSnippet,
    };
}

/**
 * Get or create sync state for a user
 */
async function getOrCreateSyncState(
    userId: string,
): Promise<{ historyId: string | null; id: string }> {
    const syncState = await prisma.syncState.findUnique({
        where: { userId },
    });

    if (syncState) {
        return { historyId: syncState.historyId, id: syncState.id };
    }

    // Create a new sync state if none exists
    const newSyncState = await prisma.syncState.create({
        data: {
            userId,
            historyId: null,
            syncInProgress: false,
        },
    });

    return { historyId: null, id: newSyncState.id };
}

/**
 * Process a single message from Gmail and store it in the database
 */
async function processMessage(gmail: any, messageId: string, userId: string): Promise<boolean> {
    try {
        // Fetch full message details
        const fullMessage = await gmail.users.messages.get({
            userId: GMAIL_USER_ID,
            id: messageId,
            format: "full",
        });

        if (!fullMessage.data) return false;

        // Extract thread ID
        const threadId = fullMessage.data.threadId || "";

        // Check if the message exists in our database
        const existingMessage = await prisma.message.findUnique({
            where: { id: messageId },
        });

        // If the message doesn't exist yet, create it
        if (!existingMessage) {
            await prisma.message.create({
                data: {
                    id: messageId,
                    threadId,
                    userId,
                },
            });
        }

        // Check if email already exists
        const existingEmail = await prisma.email.findUnique({
            where: { id: messageId },
        });

        // If email already exists, skip processing it
        if (existingEmail) return true;

        // Extract email details
        const headers = fullMessage.data.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const to = headers.find((h: any) => h.name === "To")?.value || "";

        // Get email content
        const content = fullMessage.data.payload
            ? extractContentFromParts(fullMessage.data.payload)
            : { text: "", html: "" };

        // Create email object
        const emailData = {
            id: messageId,
            threadId,
            userId,
            subject,
            from,
            to,
            snippet: fullMessage.data.snippet || "",
            body:
                content.html || content.text || fullMessage.data.snippet || "No content available",
            isRead: !fullMessage.data.labelIds?.includes("UNREAD"),
            isStarred: fullMessage.data.labelIds?.includes("STARRED") || false,
            labels: fullMessage.data.labelIds || [],
            internalDate: fullMessage.data.internalDate || null,
        };

        // Encrypt and store the email
        const encryptedEmail = encryptEmailFields(emailData);
        await prisma.email.create({ data: encryptedEmail });

        return true;
    } catch (error) {
        log(`Error processing message ${messageId}:`, error);
        return false;
    }
}

/**
 * Fetch all Gmail messages recursively with 500 per page
 */
async function fetchAllMessages(gmail: gmail_v1.Gmail) {
    let allMessages: any[] = [];
    let pageToken: string | null = null;
    let batchCount = 0;

    do {
        batchCount++;
        log(`Fetching batch #${batchCount}, current count: ${allMessages.length}`);

        const response: GaxiosResponse<any> = await gmail.users.messages.list({
            userId: GMAIL_USER_ID,
            maxResults: FULL_SYNC_BATCH_SIZE,
            pageToken: pageToken || undefined,
        });

        const messages = response.data.messages || [];
        allMessages = [...allMessages, ...messages];

        // Get next page token
        pageToken = response.data.nextPageToken || null;

        // Log progress
        log(
            `Batch #${batchCount} complete, fetched ${messages.length} messages. Total: ${allMessages.length}`,
        );
    } while (pageToken);

    return allMessages.reverse();
}

/**
 * Store messages in the database
 */
async function storeMessagesInDb(
    messages: any[],
    userId: string,
): Promise<{ created: number; existing: number }> {
    if (messages.length === 0) {
        return { created: 0, existing: 0 };
    }

    try {
        // Find existing messages
        const existingMessageIds = new Set(
            (
                await prisma.message.findMany({
                    where: {
                        id: {
                            in: messages.slice(0, 1000).map((msg) => msg.id),
                        },
                    },
                    select: { id: true },
                })
            ).map((msg) => msg.id),
        );

        // Create records for messages that don't exist
        const newMessages = messages.filter((msg) => !existingMessageIds.has(msg.id));
        if (newMessages.length === 0) {
            return { created: 0, existing: existingMessageIds.size };
        }

        // Prepare data for bulk insertion, batched for safety
        const batchSize = 500;
        let created = 0;

        for (let i = 0; i < newMessages.length; i += batchSize) {
            const batch = newMessages.slice(i, i + batchSize);
            const messagesToCreate = batch.map((msg) => ({
                id: msg.id,
                threadId: msg.threadId,
                userId,
            }));

            // Bulk create messages
            const result = await prisma.message.createMany({
                data: messagesToCreate,
                skipDuplicates: true,
            });

            created += result.count;
        }

        return {
            created,
            existing: existingMessageIds.size,
        };
    } catch (error) {
        log(`Error storing messages in DB: ${error}`);
        return { created: 0, existing: 0 };
    }
}

/**
 * Perform a full initial sync for a user
 */
async function performFullSync(
    userId: string,
    accessToken: string,
    refreshToken: string | null,
): Promise<boolean> {
    try {
        log(`Starting full sync for user ${userId}`);

        // Use the withGmailApi helper to handle token refreshes
        const allMessages =
            (await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
                return fetchAllMessages(gmail);
            })) || [];

        if (allMessages.length === 0) {
            log(`No messages found for user ${userId}`);
            return true;
        }

        log(`Fetched ${allMessages.length} messages for user ${userId}, storing in database`);

        // Store messages in DB
        const { created, existing } = await storeMessagesInDb(allMessages, userId);
        log(`Stored messages in database: ${created} created, ${existing} existing`);

        // Process a subset of full messages for the newest messages (e.g. the last 50)
        const messagesToProcess = allMessages.slice(0, 50);
        log(`Processing ${messagesToProcess.length} newest messages to extract full content`);

        let processedCount = 0;

        // Process in batches
        for (let i = 0; i < messagesToProcess.length; i += SYNC_BATCH_SIZE) {
            const batch = messagesToProcess.slice(i, i + SYNC_BATCH_SIZE);

            // Process batch in parallel with withGmailApi for each message
            const results = await Promise.allSettled(
                batch.map((msg) =>
                    withGmailApi(userId, accessToken, refreshToken, (gmail) =>
                        processMessage(gmail, msg.id, userId),
                    ),
                ),
            );

            // Count successful operations
            processedCount += results.filter(
                (result) => result.status === "fulfilled" && result.value === true,
            ).length;
        }

        log(`Processed ${processedCount}/${messagesToProcess.length} full message details`);

        // Get Gmail profile to obtain current historyId for future incremental syncs
        const profile = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            return gmail.users.getProfile({
                userId: GMAIL_USER_ID,
            });
        });

        if (!profile) {
            log(`Failed to get profile for user ${userId}`);
            return false;
        }

        const newHistoryId = profile.data.historyId;

        // Update sync state with the new history ID
        if (newHistoryId) {
            await prisma.syncState.update({
                where: { userId },
                data: {
                    historyId: newHistoryId,
                    lastSyncTime: new Date(),
                },
            });

            log(`Updated history ID to ${newHistoryId} for user ${userId}`);
        }

        return true;
    } catch (error) {
        log(`Error performing full sync for user ${userId}:`, error);
        return false;
    }
}

/**
 * Process changes for a user using Gmail's History API
 */
async function processUserChanges(
    userId: string,
    accessToken: string,
    refreshToken: string | null,
    historyId: string | null,
): Promise<{ success: boolean; newHistoryId: string | null }> {
    try {
        // If no history ID, we need to get a starting point
        if (!historyId) {
            try {
                // Get profile to obtain current historyId using withGmailApi
                const profile = await withGmailApi(
                    userId,
                    accessToken,
                    refreshToken,
                    async (gmail) => {
                        return gmail.users.getProfile({
                            userId: GMAIL_USER_ID,
                        });
                    },
                );

                if (!profile) {
                    log(`Failed to get profile for user ${userId}`);
                    return { success: false, newHistoryId: null };
                }

                const newHistoryId = profile.data.historyId || null;

                // Update sync state with the new history ID
                if (newHistoryId) {
                    await prisma.syncState.update({
                        where: { userId },
                        data: { historyId: newHistoryId },
                    });

                    log(`Initialized history ID ${newHistoryId} for user ${userId}`);
                }

                // Return early - we'll start syncing from this point next time
                return { success: true, newHistoryId };
            } catch (error) {
                log(`Error initializing history ID for user ${userId}:`, error);
                return { success: false, newHistoryId: null };
            }
        }

        // Get changes since last sync using withGmailApi
        const historyResponse = await withGmailApi(
            userId,
            accessToken,
            refreshToken,
            async (gmail) => {
                return gmail.users.history.list({
                    userId: GMAIL_USER_ID,
                    startHistoryId: historyId,
                    maxResults: MAX_HISTORY_RESULTS,
                    // Request all history types to ensure we don't miss any changes
                    historyTypes: ["messageAdded", "messageDeleted", "labelAdded", "labelRemoved"],
                });
            },
        );

        if (!historyResponse || !historyResponse.data) {
            log(`Failed to get history data for user ${userId}`);
            return { success: false, newHistoryId: historyId };
        }

        if (!historyResponse.data.history) {
            log(`No history data for user ${userId}`);
            return {
                success: true,
                newHistoryId: historyResponse.data.historyId || historyId,
            };
        }

        // Log the number of history records received
        log(`Received ${historyResponse.data.history.length} history records for user ${userId}`);

        // Process each history record
        const messageIds = new Set<string>();
        const deletedMessageIds = new Set<string>();

        // Stats for logging
        let addedCount = 0;
        let deletedCount = 0;
        let labelAddedCount = 0;
        let labelRemovedCount = 0;

        // Collect all message IDs that need updating
        for (const record of historyResponse.data.history || []) {
            // Handle added messages (new messages that appeared in the mailbox)
            for (const added of record.messagesAdded || []) {
                if (added.message?.id) {
                    messageIds.add(added.message.id);
                    addedCount++;
                }
            }

            // Handle deleted messages (messages that were permanently deleted, not just moved to trash)
            for (const deleted of record.messagesDeleted || []) {
                if (deleted.message?.id) {
                    deletedMessageIds.add(deleted.message.id);
                    // Also remove from messageIds in case it was added and then deleted
                    messageIds.delete(deleted.message.id);
                    deletedCount++;
                }
            }

            // Handle label changes
            // Labels added (like marking as read, adding a star, applying a category)
            for (const labelAdded of record.labelsAdded || []) {
                if (labelAdded.message?.id) {
                    messageIds.add(labelAdded.message.id);
                    labelAddedCount++;
                }
            }

            // Labels removed (like marking as unread, removing a star)
            for (const labelRemoved of record.labelsRemoved || []) {
                if (labelRemoved.message?.id) {
                    messageIds.add(labelRemoved.message.id);
                    labelRemovedCount++;
                }
            }
        }

        // Log stats about the changes
        log(
            `History changes for user ${userId}: ${addedCount} messages added, ${deletedCount} messages deleted, ${labelAddedCount} label additions, ${labelRemovedCount} label removals`,
        );

        // Process deleted messages if any
        if (deletedMessageIds.size > 0) {
            log(`Processing ${deletedMessageIds.size} deleted messages for user ${userId}`);

            try {
                // Delete emails from our database - this will cascade to related data due to DB constraints
                await prisma.email.deleteMany({
                    where: {
                        id: {
                            in: Array.from(deletedMessageIds),
                        },
                        userId,
                    },
                });

                // Ensure messages are deleted too - might be redundant with cascading deletes
                await prisma.message.deleteMany({
                    where: {
                        id: {
                            in: Array.from(deletedMessageIds),
                        },
                        userId,
                    },
                });

                log(`Successfully deleted ${deletedMessageIds.size} messages from database`);
            } catch (error) {
                log(`Error deleting messages from database: ${error}`);
                // Continue with the sync process even if deletions fail
            }
        }

        // Process all updated messages
        log(`Processing ${messageIds.size} changed messages for user ${userId}`);

        // Process messages in batches to avoid overwhelming the API
        const messageArray = Array.from(messageIds);
        let processedCount = 0;

        for (let i = 0; i < messageArray.length; i += SYNC_BATCH_SIZE) {
            const batch = messageArray.slice(i, i + SYNC_BATCH_SIZE);

            // Process batch in parallel using withGmailApi for each message
            const results = await Promise.allSettled(
                batch.map((messageId) =>
                    withGmailApi(userId, accessToken, refreshToken, (gmail) =>
                        processMessage(gmail, messageId, userId),
                    ),
                ),
            );

            // Count successful operations
            const successful = results.filter(
                (result) => result.status === "fulfilled" && result.value === true,
            ).length;

            processedCount += successful;

            log(
                `Processed batch ${i / SYNC_BATCH_SIZE + 1}/${Math.ceil(messageArray.length / SYNC_BATCH_SIZE)}, ${successful}/${batch.length} successful`,
            );
        }

        log(
            `Successfully processed ${processedCount}/${messageIds.size} messages for user ${userId}`,
        );

        // Update the history ID
        const newHistoryId = historyResponse.data.historyId || historyId;

        if (newHistoryId !== historyId) {
            await prisma.syncState.update({
                where: { userId },
                data: {
                    historyId: newHistoryId,
                    lastSyncTime: new Date(),
                },
            });
        }

        return { success: true, newHistoryId };
    } catch (error: any) {
        // Check for history ID invalidity (common when mailbox changes substantially)
        if (
            error?.response?.status === 404 &&
            error?.response?.data?.error?.message?.includes("Start history ID")
        ) {
            log(`History ID invalid for user ${userId}, resetting`);

            await prisma.syncState.update({
                where: { userId },
                data: {
                    historyId: null,
                    lastSyncTime: new Date(),
                },
            });

            return { success: true, newHistoryId: null };
        }

        log(`Error processing changes for user ${userId}:`, error);
        return { success: false, newHistoryId: historyId };
    }
}

/**
 * GET handler for background email sync
 * This will be called by Vercel Cron
 */
export async function GET() {
    try {
        // Get users who need syncing, prioritizing those we haven't synced recently
        // and who have valid credentials
        const usersToSync = await prisma.user.findMany({
            where: {
                accounts: {
                    some: {
                        providerId: "google",
                        accessToken: { not: null },
                        refreshToken: { not: null },
                    },
                },
            },
            include: {
                accounts: {
                    where: {
                        providerId: "google",
                    },
                },
                syncState: true,
            },
            orderBy: {
                syncState: {
                    lastSyncTime: "asc",
                },
            },
            take: MAX_USERS_PER_RUN,
        });

        log(`Found ${usersToSync.length} users to sync`);

        // Process each user
        const results = [];

        for (const user of usersToSync) {
            const userId = user.id;
            log(`Processing user ${userId}`);

            try {
                // Set sync in progress
                await prisma.syncState.upsert({
                    where: { userId },
                    update: { syncInProgress: true },
                    create: {
                        userId,
                        syncInProgress: true,
                        historyId: null,
                    },
                });

                // Get Google account
                const account = user.accounts[0];
                if (!account || !account.accessToken) {
                    log(`No valid Google account for user ${userId}`);
                    continue;
                }

                let success = false;
                let newHistoryId = null;

                // Check if we need a full sync or incremental sync
                if (!user.syncState || !user.syncState.historyId) {
                    // Perform a full sync for new users or those without a history ID
                    log(`Performing full sync for user ${userId} (no history ID)`);
                    success = await performFullSync(
                        userId,
                        account.accessToken,
                        account.refreshToken,
                    );
                } else {
                    // Get history ID and perform incremental sync
                    const historyId = user.syncState.historyId;
                    log(
                        `Performing incremental sync for user ${userId} with history ID ${historyId}`,
                    );

                    // Process changes
                    const result = await processUserChanges(
                        userId,
                        account.accessToken,
                        account.refreshToken,
                        historyId,
                    );
                    success = result.success;
                    newHistoryId = result.newHistoryId;
                }

                results.push({
                    userId,
                    success,
                    newHistoryId,
                });

                // Update sync state
                await prisma.syncState.update({
                    where: { userId },
                    data: {
                        syncInProgress: false,
                        lastSyncTime: new Date(),
                    },
                });
            } catch (error) {
                log(`Error processing user ${userId}:`, error);

                // Ensure sync is marked as not in progress even on error
                await prisma.syncState.update({
                    where: { userId },
                    data: {
                        syncInProgress: false,
                        lastSyncTime: new Date(),
                    },
                });

                results.push({
                    userId,
                    success: false,
                    error: error instanceof Error ? error.message : "Unknown error",
                });
            }
        }

        return NextResponse.json({
            success: true,
            syncedUsers: results.length,
            results,
        });
    } catch (error) {
        log("Error in background sync:", error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}

/**
 * POST handler for user-triggered background sync
 * This allows a single user to trigger their own sync
 */
export async function POST(request: Request) {
    try {
        // Check if this is a full sync request
        const url = new URL(request.url);
        const fullSync = url.searchParams.get("fullSync") === "true";

        // Authenticate user
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Set sync in progress
        await prisma.syncState.upsert({
            where: { userId },
            update: { syncInProgress: true },
            create: {
                userId,
                syncInProgress: true,
                historyId: null,
            },
        });

        // Get Google account for the user
        const account = await prisma.account.findFirst({
            where: {
                userId,
                providerId: "google",
            },
        });

        if (!account?.accessToken) {
            // Reset sync status
            await prisma.syncState.update({
                where: { userId },
                data: { syncInProgress: false },
            });
            return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
        }

        // Process changes in a non-blocking way
        // Use top-level await here since we're in a module context
        (async () => {
            try {
                if (fullSync) {
                    // Perform full sync with reversed messages (newest first)
                    log(`Starting full sync (reversed) for user ${userId}`);
                    await performFullSync(userId, account.accessToken || "", account.refreshToken);
                } else {
                    // Get or create sync state for incremental sync
                    const { historyId } = await getOrCreateSyncState(userId);

                    // Process changes
                    await processUserChanges(
                        userId,
                        account.accessToken || "",
                        account.refreshToken,
                        historyId || null,
                    );
                }

                // Update sync state when done
                await prisma.syncState.update({
                    where: { userId },
                    data: {
                        syncInProgress: false,
                        lastSyncTime: new Date(),
                    },
                });

                log(`Completed user-triggered sync for user ${userId}`);
            } catch (error) {
                log(`Error in user-triggered sync for user ${userId}:`, error);

                // Ensure sync is marked as not in progress even on error
                await prisma.syncState.update({
                    where: { userId },
                    data: {
                        syncInProgress: false,
                        lastSyncTime: new Date(),
                    },
                });
            }
        })();

        // Return immediately to the client
        return NextResponse.json({
            success: true,
            message: fullSync
                ? "Full background sync initiated (newest messages first)"
                : "Incremental background sync initiated",
        });
    } catch (error) {
        log("Error in user-triggered sync:", error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 },
        );
    }
}
