import { NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { google } from "googleapis";
import env from "@/libs/env";
import { encryptText, encodeEncryptedData } from "@/libs/utils/encryption";
import { extractContentFromParts } from "@/libs/utils/email-content";
import { auth, type User } from "@/libs/auth";
import { headers } from "next/headers";
import type { Account } from "better-auth";
import { initializeGmailClient, refreshAccessToken, withGmailApi } from "../utils/withGmail";
import type { GaxiosResponse } from "gaxios";

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
async function fetchAllMessages(gmail: any) {
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

    log(`All batches complete. Total messages: ${allMessages.length}`);

    // Reverse the list so newest messages come first
    return allMessages.reverse();
}

/**
 * Store messages in the database
 */
async function storeMessagesInDb(
    messages: any[],
    userId: string,
): Promise<{ created: number; existing: number }> {
    // Prepare message data for database (messages should already be reversed)
    const messageData = messages.map((msg) => ({
        id: msg.id,
        threadId: msg.threadId,
        userId,
        // We don't have internalDate from list API, so use current timestamp
        createdAt: new Date().toISOString(),
    }));

    log(`Preparing to store ${messageData.length} messages in the database`);

    try {
        // Split into chunks for better performance
        const chunkSize = 1000;
        let created = 0;
        let existing = 0;

        for (let i = 0; i < messageData.length; i += chunkSize) {
            const chunk = messageData.slice(i, i + chunkSize);
            log(
                `Processing chunk ${Math.floor(i / chunkSize) + 1}/${Math.ceil(messageData.length / chunkSize)}`,
            );

            // Perform database transaction for each chunk
            const result = await prisma.$transaction(async (tx: any) => {
                // Find existing messages
                const existingMessages = await tx.message.findMany({
                    where: {
                        id: {
                            in: chunk.map((m) => m.id),
                        },
                    },
                    select: { id: true },
                });

                const existingIds = new Set(existingMessages.map((m: { id: string }) => m.id));
                const newMessages = chunk.filter((m) => !existingIds.has(m.id));

                log(
                    `Found ${existingIds.size} existing messages, will create ${newMessages.length} new messages`,
                );

                // Create new messages
                if (newMessages.length > 0) {
                    await tx.message.createMany({
                        data: newMessages,
                        skipDuplicates: true,
                    });
                }

                return {
                    created: newMessages.length,
                    existing: existingIds.size,
                };
            });

            created += result.created;
            existing += result.existing;
        }

        return { created, existing };
    } catch (error) {
        log("Error storing messages in database:", error);
        throw error;
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

        const gmail = initializeGmailClient(accessToken);
        let processedCount = 0;

        // Process in batches
        for (let i = 0; i < messagesToProcess.length; i += SYNC_BATCH_SIZE) {
            const batch = messagesToProcess.slice(i, i + SYNC_BATCH_SIZE);

            // Process batch in parallel
            const results = await Promise.allSettled(
                batch.map((msg) => processMessage(gmail, msg.id, userId)),
            );

            // Count successful operations
            processedCount += results.filter(
                (result) => result.status === "fulfilled" && result.value === true,
            ).length;
        }

        log(`Processed ${processedCount}/${messagesToProcess.length} full message details`);

        // Get Gmail profile to obtain current historyId for future incremental syncs
        const profile = await gmail.users.getProfile({
            userId: GMAIL_USER_ID,
        });

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
    historyId: string | null,
): Promise<{ success: boolean; newHistoryId: string | null }> {
    try {
        // Initialize Gmail client
        const gmail = initializeGmailClient(accessToken);

        // If no history ID, we need to get a starting point
        if (!historyId) {
            try {
                // Get profile to obtain current historyId
                const profile = await gmail.users.getProfile({
                    userId: GMAIL_USER_ID,
                });

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

        // Get changes since last sync
        const historyResponse = await gmail.users.history.list({
            userId: GMAIL_USER_ID,
            startHistoryId: historyId,
            maxResults: MAX_HISTORY_RESULTS,
            historyTypes: ["messageAdded", "labelAdded", "labelRemoved"],
        });

        if (!historyResponse.data.history) {
            log(`No history data for user ${userId}`);
            return {
                success: true,
                newHistoryId: historyResponse.data.historyId || historyId,
            };
        }

        // Process each history record
        const messageIds = new Set<string>();

        // Collect all message IDs that need updating
        for (const record of historyResponse.data.history || []) {
            // Handle added messages
            for (const added of record.messagesAdded || []) {
                if (added.message?.id) {
                    messageIds.add(added.message.id);
                }
            }

            // Handle label changes
            for (const modified of [
                ...(record.labelsAdded || []),
                ...(record.labelsRemoved || []),
            ]) {
                if (modified.message?.id) {
                    messageIds.add(modified.message.id);
                }
            }
        }

        // Process all updated messages
        log(`Processing ${messageIds.size} changed messages for user ${userId}`);

        // Process messages in batches to avoid overwhelming the API
        const messageArray = Array.from(messageIds);
        let processedCount = 0;

        for (let i = 0; i < messageArray.length; i += SYNC_BATCH_SIZE) {
            const batch = messageArray.slice(i, i + SYNC_BATCH_SIZE);

            // Process batch in parallel
            const results = await Promise.allSettled(
                batch.map((messageId) => processMessage(gmail, messageId, userId)),
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

        // Handle token expiration
        if (error?.response?.status === 401) {
            log(`Token expired for user ${userId}, attempting refresh`);

            const newToken = await refreshAccessToken(userId);
            if (newToken) {
                log(`Successfully refreshed token for user ${userId}, retrying sync`);
                return processUserChanges(userId, newToken, historyId);
            }
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

                // Get or create sync state
                const { historyId } = user.syncState || (await getOrCreateSyncState(userId));

                // Process changes
                const { success, newHistoryId } = await processUserChanges(
                    userId,
                    account.accessToken,
                    historyId,
                );

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

        // Check if a sync is already in progress for this user
        const existingSync = await prisma.syncState.findUnique({
            where: { userId },
            select: { syncInProgress: true },
        });

        if (existingSync?.syncInProgress) {
            return NextResponse.json(
                {
                    success: false,
                    message: "Sync already in progress for this user",
                },
                { status: 409 },
            );
        }

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
                    await processUserChanges(userId, account.accessToken || "", historyId || null);
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
