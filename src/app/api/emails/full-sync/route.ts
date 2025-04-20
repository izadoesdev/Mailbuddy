import { withGmailApi } from "@/app/api/utils/withGmail";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { encodeEncryptedData, encryptText, extractContentFromParts } from "@/libs/utils";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Constants for batching and pagination
const GMAIL_USER_ID = "me";
const MESSAGE_LIST_BATCH_SIZE = 500; // Number of messages to request from Gmail per page
const CONTENT_FETCH_BATCH_SIZE = 25; // Number of full messages to fetch in parallel
const STORAGE_BATCH_SIZE = 50; // Number of emails to store in DB in a single transaction

// Helper function for logging with timestamps
const log = (message: string, ...args: any[]) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Full Email Sync API] ${message}`, args.length ? args : "");
};

// Keep track of ongoing syncs to prevent duplicates
const ongoingSyncs = new Map<
    string,
    {
        controller: AbortController;
        startTime: Date;
        totalMessages: number;
        processedMessages: number;
        lastUpdateTime: Date;
    }
>();

/**
 * Extract email headers from Gmail message
 */
function extractEmailHeaders(headers: any[] = []): { subject: string; from: string; to: string } {
    return {
        subject: headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "",
        from: headers.find((h) => h.name?.toLowerCase() === "from")?.value || "",
        to: headers.find((h) => h.name?.toLowerCase() === "to")?.value || "",
    };
}

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

    return {
        ...emailData,
        body: encryptedBody,
        subject: encryptedSubject,
        snippet: encryptedSnippet,
    };
}

/**
 * Clean up sync process for a user
 */
function cleanupSync(userId: string) {
    if (ongoingSyncs.has(userId)) {
        ongoingSyncs.delete(userId);
        log(`Cleaned up sync for user ${userId}`);
    }
}

/**
 * Gets sync status for a user
 */
function getSyncStatus(userId: string) {
    const syncInfo = ongoingSyncs.get(userId);
    if (!syncInfo) return null;

    const { startTime, totalMessages, processedMessages, lastUpdateTime } = syncInfo;
    const elapsedSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
    const progress =
        totalMessages > 0
            ? Math.min(100, Math.floor((processedMessages / totalMessages) * 100))
            : 0;

    // Calculate rate and estimated completion time
    const messagesPerSecond = elapsedSeconds > 0 ? processedMessages / elapsedSeconds : 0;
    const remainingMessages = totalMessages - processedMessages;
    const estimatedSecondsRemaining =
        messagesPerSecond > 0 ? Math.floor(remainingMessages / messagesPerSecond) : 0;

    return {
        inProgress: true,
        startTime: startTime.toISOString(),
        lastUpdateTime: lastUpdateTime.toISOString(),
        elapsedSeconds,
        totalMessages,
        processedMessages,
        remainingMessages,
        progress,
        messagesPerSecond: messagesPerSecond.toFixed(2),
        estimatedSecondsRemaining,
    };
}

/**
 * GET handler for checking sync status
 */
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get sync status
    const status = getSyncStatus(userId);

    if (status) {
        return NextResponse.json(status);
    }

    // If no active sync, check the database for the last sync info
    const syncState = await prisma.syncState.findUnique({
        where: { userId },
        select: {
            lastSyncTime: true,
            syncInProgress: true,
            historyId: true,
        },
    });

    if (!syncState) {
        return NextResponse.json({
            inProgress: false,
            lastSyncTime: null,
            message: "No sync has been performed yet",
        });
    }

    return NextResponse.json({
        inProgress: syncState.syncInProgress,
        lastSyncTime: syncState.lastSyncTime?.toISOString(),
        historyId: syncState.historyId,
        message: syncState.syncInProgress
            ? "Sync is in progress, but status information is not available"
            : "No active sync is running",
    });
}

/**
 * POST handler to start a full email sync
 */
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            accounts: {
                where: {
                    providerId: "google",
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    const accessToken = user.accounts[0].accessToken;
    const refreshToken = user.accounts[0].refreshToken;

    // Check if a sync is already in progress
    if (ongoingSyncs.has(userId)) {
        const status = getSyncStatus(userId);
        return NextResponse.json(
            {
                error: "Sync already in progress",
                status,
            },
            { status: 409 },
        );
    }

    // Create an abort controller for cancellation
    const abortController = new AbortController();

    // Register the new sync
    ongoingSyncs.set(userId, {
        controller: abortController,
        startTime: new Date(),
        totalMessages: 0,
        processedMessages: 0,
        lastUpdateTime: new Date(),
    });

    // Update sync state in the database
    await prisma.syncState.upsert({
        where: { userId },
        update: {
            syncInProgress: true,
            lastSyncTime: new Date(),
        },
        create: {
            userId,
            syncInProgress: true,
            lastSyncTime: new Date(),
        },
    });

    // Start the sync process in the background
    performFullSync(userId, accessToken, refreshToken, abortController.signal).catch((error) => {
        log(`Sync error for user ${userId}:`, error);
        // Make sure to clean up on error
        cleanupSync(userId);

        // Update sync state in the database
        prisma.syncState
            .update({
                where: { userId },
                data: {
                    syncInProgress: false,
                },
            })
            .catch((e) => log("Error updating sync state after error", e));
    });

    // Return an immediate response
    return NextResponse.json({
        message: "Full email sync started",
        status: {
            inProgress: true,
            startTime: new Date().toISOString(),
        },
    });
}

/**
 * DELETE handler to cancel an ongoing sync
 */
export async function DELETE(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if there's an ongoing sync
    if (!ongoingSyncs.has(userId)) {
        return NextResponse.json({ error: "No sync in progress" }, { status: 404 });
    }

    // Get the controller and abort the sync
    const syncInfo = ongoingSyncs.get(userId);
    if (syncInfo) {
        syncInfo.controller.abort();
    }

    // Update sync state in the database
    await prisma.syncState.update({
        where: { userId },
        data: { syncInProgress: false },
    });

    return NextResponse.json({
        message: "Sync cancelled successfully",
    });
}

/**
 * Main function to perform the full email sync
 */
async function performFullSync(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    abortSignal: AbortSignal,
) {
    try {
        log(`Starting full email sync for user ${userId}`);
        let totalMessages = 0;
        let processedMessages = 0;
        let latestHistoryId = null;

        // Phase 1: Get all message IDs
        log("Phase 1: Collecting all message IDs from Gmail");
        const allMessageIds = await collectAllMessageIds(
            userId,
            accessToken,
            refreshToken,
            abortSignal,
        );

        if (abortSignal.aborted) {
            log(`Sync aborted during message ID collection for user ${userId}`);
            return;
        }

        totalMessages = allMessageIds.length;
        log(`Found ${totalMessages} total messages to sync`);

        // Update sync info with total count
        const syncInfo = ongoingSyncs.get(userId);
        if (syncInfo) {
            syncInfo.totalMessages = totalMessages;
            syncInfo.lastUpdateTime = new Date();
        }

        // Phase 2: Process all messages in batches, newest first
        log(`Phase 2: Processing all ${totalMessages} messages in batches, newest first`);

        // Reverse the array to process newest messages first
        allMessageIds.reverse();

        // Split into batches for parallel processing
        const batches = [];
        for (let i = 0; i < allMessageIds.length; i += CONTENT_FETCH_BATCH_SIZE) {
            if (abortSignal.aborted) break;
            batches.push(allMessageIds.slice(i, i + CONTENT_FETCH_BATCH_SIZE));
        }

        log(`Created ${batches.length} batches for message processing`);

        // Process each batch
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
            if (abortSignal.aborted) {
                log(`Sync aborted during batch processing for user ${userId}`);
                break;
            }

            const batch = batches[batchIndex];
            log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} messages)`);

            // Fetch full message content for this batch
            const messageDetails = await fetchMessageBatch(
                userId,
                batch,
                accessToken,
                refreshToken,
            );

            if (abortSignal.aborted) break;

            // Update the history ID from the newest message
            if (messageDetails.length > 0 && messageDetails[0].historyId && !latestHistoryId) {
                latestHistoryId = messageDetails[0].historyId;
                log(`Updated latest historyId to ${latestHistoryId}`);
            }

            // If messages were fetched, store them in the database
            if (messageDetails.length > 0) {
                await storeMessageBatchInDatabase(messageDetails, userId);
            }

            // Update progress
            processedMessages += batch.length;

            // Update sync info
            const syncInfo = ongoingSyncs.get(userId);
            if (syncInfo) {
                syncInfo.processedMessages = processedMessages;
                syncInfo.lastUpdateTime = new Date();
            }

            log(
                `Processed ${processedMessages}/${totalMessages} messages (${Math.floor((processedMessages / totalMessages) * 100)}%)`,
            );

            // Small delay to prevent rate limiting
            if (batchIndex < batches.length - 1 && !abortSignal.aborted) {
                await new Promise((resolve) => setTimeout(resolve, 100));
            }
        }

        // Phase 3: Update sync state with history ID
        if (!abortSignal.aborted && latestHistoryId) {
            log(`Phase 3: Updating sync state with history ID ${latestHistoryId}`);
            await prisma.syncState.update({
                where: { userId },
                data: {
                    historyId: latestHistoryId,
                    syncInProgress: false,
                    lastSyncTime: new Date(),
                },
            });
        }

        log(
            `Full email sync completed for user ${userId}. Processed ${processedMessages}/${totalMessages} messages`,
        );
    } catch (error) {
        log(`Error in full sync for user ${userId}:`, error);
        throw error;
    } finally {
        // Make sure to clean up
        cleanupSync(userId);

        // Make sure syncInProgress is set to false
        await prisma.syncState
            .update({
                where: { userId },
                data: { syncInProgress: false },
            })
            .catch((e) => log("Error updating sync state in finally block", e));
    }
}

/**
 * Collect all message IDs from Gmail
 */
async function collectAllMessageIds(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    abortSignal: AbortSignal,
): Promise<string[]> {
    const allMessageIds: string[] = [];
    let pageToken: string | null = null;

    do {
        if (abortSignal.aborted) {
            log("Message ID collection aborted");
            break;
        }

        const result = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            return gmail.users.messages.list({
                userId: GMAIL_USER_ID,
                maxResults: MESSAGE_LIST_BATCH_SIZE,
                pageToken: pageToken || undefined,
                fields: "messages(id),nextPageToken,resultSizeEstimate",
            });
        });

        if (!result || !result.data) {
            log("No results returned from Gmail API");
            break;
        }

        const messages = result.data.messages || [];
        const messageIds = messages.map((msg) => msg.id as string).filter(Boolean);
        allMessageIds.push(...messageIds);

        pageToken = result.data.nextPageToken || null;
        log(
            `Collected batch of ${messageIds.length} message IDs, total: ${allMessageIds.length}, nextPageToken: ${pageToken ? "yes" : "no"}`,
        );
    } while (pageToken && !abortSignal.aborted);

    return allMessageIds;
}

/**
 * Fetch a batch of full messages from Gmail
 */
async function fetchMessageBatch(
    userId: string,
    messageIds: string[],
    accessToken: string | null,
    refreshToken: string | null,
): Promise<any[]> {
    const result = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
        try {
            log(`Creating batch request for ${messageIds.length} messages`);

            // Since we don't have direct batch support in the client library,
            // we'll fall back to parallel requests for now
            const messagePromises = messageIds.map((messageId) =>
                gmail.users.messages.get({
                    userId: GMAIL_USER_ID,
                    id: messageId,
                    format: "full",
                }),
            );

            // Execute all requests in parallel
            const responses = await Promise.all(messagePromises);

            // Process the responses
            const processedMessages = [];

            for (let i = 0; i < responses.length; i++) {
                const response = responses[i];
                if (!response.data || !response.data.id) continue;

                const message = response.data;
                const headers = message.payload?.headers || [];
                const { subject, from, to } = extractEmailHeaders(headers);

                const content = message.payload
                    ? extractContentFromParts(message.payload)
                    : { text: "", html: "" };

                processedMessages.push({
                    id: message.id,
                    threadId: message.threadId,
                    userId,
                    subject,
                    from,
                    to,
                    snippet: message.snippet || "",
                    body: content.html || content.text || message.snippet || "No content available",
                    isRead: !message.labelIds?.includes("UNREAD"),
                    isStarred: message.labelIds?.includes("STARRED") || false,
                    labels: message.labelIds || [],
                    internalDate: message.internalDate || new Date().getTime().toString(),
                    historyId: message.historyId,
                });
            }

            log(`Successfully processed ${processedMessages.length}/${messageIds.length} messages`);
            return processedMessages;
        } catch (error) {
            log("Error in batch request:", error);

            // If the parallel approach failed, try sequential requests
            log("Parallel requests failed, falling back to sequential requests");

            const processedMessages = [];

            for (const messageId of messageIds) {
                try {
                    const response = await gmail.users.messages.get({
                        userId: GMAIL_USER_ID,
                        id: messageId,
                        format: "full",
                    });

                    if (!response.data || !response.data.id) continue;

                    const message = response.data;
                    const headers = message.payload?.headers || [];
                    const { subject, from, to } = extractEmailHeaders(headers);

                    const content = message.payload
                        ? extractContentFromParts(message.payload)
                        : { text: "", html: "" };

                    processedMessages.push({
                        id: message.id,
                        threadId: message.threadId,
                        userId,
                        subject,
                        from,
                        to,
                        snippet: message.snippet || "",
                        body:
                            content.html ||
                            content.text ||
                            message.snippet ||
                            "No content available",
                        isRead: !message.labelIds?.includes("UNREAD"),
                        isStarred: message.labelIds?.includes("STARRED") || false,
                        labels: message.labelIds || [],
                        internalDate: message.internalDate || new Date().getTime().toString(),
                        historyId: message.historyId,
                    });
                } catch (err) {
                    log(`Error fetching message ${messageId}:`, err);
                    // Continue with other messages
                }
            }

            return processedMessages;
        }
    });

    return result || [];
}

/**
 * Store a batch of messages in the database
 */
async function storeMessageBatchInDatabase(messages: any[], userId: string) {
    if (messages.length === 0) return;

    try {
        // First, encrypt all the messages
        const encryptedMessages = messages.map((message) => {
            // Remove historyId from the email data since it's not in the Email model
            const { historyId, ...emailData } = message;
            return encryptEmailFields(emailData);
        });

        // Create message records and email records in smaller batches
        for (let i = 0; i < encryptedMessages.length; i += STORAGE_BATCH_SIZE) {
            const batch = encryptedMessages.slice(i, i + STORAGE_BATCH_SIZE);

            // Prepare message records
            const messageRecords = batch.map((msg) => ({
                id: msg.id,
                threadId: msg.threadId,
                userId: msg.userId,
            }));

            // Store in database using a transaction
            await prisma.$transaction(async (tx) => {
                // Insert messages first
                await tx.message.createMany({
                    data: messageRecords,
                    skipDuplicates: true,
                });

                // Then insert emails
                await tx.email.createMany({
                    data: batch,
                    skipDuplicates: true,
                });
            });
        }

        log(`Successfully stored ${encryptedMessages.length} messages in database`);
    } catch (error) {
        log("Error storing messages in database:", error);
        throw error;
    }
}
