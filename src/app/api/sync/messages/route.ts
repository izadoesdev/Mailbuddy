import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import env from "@/libs/env";
import { google } from "googleapis";
import type { gmail_v1 } from "googleapis";
import { headers } from "next/headers";

// Constants
const DEFAULT_BATCH_SIZE = 500;
const CHUNK_SIZE = 500;
const GMAIL_USER_ID = "me";
const PROVIDER_ID = "google";
const MESSAGE_TYPES = {
    INIT: "init",
    BATCH_START: "batch-start",
    BATCH_COMPLETE: "batch-complete",
    COUNT: "count",
    PROGRESS: "progress",
    SAVE_RESULT: "save-result",
    COMPLETE: "complete",
    ERROR: "error",
    RESUME: "resume",
};

// Helper for logging
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Message Sync API] ${message}`, data ? data : "");
};

// Keep track of ongoing syncs to prevent duplicates
const ongoingSyncs = new Map<string, { controller: AbortController; stream: ReadableStream }>();

// Interfaces
interface MessageData {
    id: string;
    threadId: string;
    userId: string;
    createdAt: string;
}

interface TransactionResult {
    created: number;
    existing: number;
}

/**
 * Send a formatted message to the stream
 */
function sendMessage(
    controller: ReadableStreamDefaultController,
    type: string,
    message: string,
    additionalData = {},
) {
    const encoder = new TextEncoder();
    controller.enqueue(
        encoder.encode(
            `${JSON.stringify({
                type,
                message,
                ...additionalData,
            })}\n`,
        ),
    );
}

/**
 * Calculate progress percentage
 */
function calculateProgress(processed: number, total: number): number {
    if (total <= 0) return 0;
    return Math.min(Math.round((processed / total) * 100), 100);
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

export async function POST(request: Request) {
    try {
        // Check if a batch size is specified in the request
        const url = new URL(request.url);
        const batchSize = url.searchParams.get("batchSize")
            ? Number.parseInt(
                  url.searchParams.get("batchSize") || DEFAULT_BATCH_SIZE.toString(),
                  10,
              )
            : DEFAULT_BATCH_SIZE;

        // Get user from session
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const userId = session.user.id;

        // Check if sync is already in progress for this user
        if (ongoingSyncs.has(userId)) {
            return new Response(JSON.stringify({ error: "Sync already in progress" }), {
                status: 409,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Create an abort controller for cancellation
        const abortController = new AbortController();

        // Get the user's Google account
        const account = await prisma.account.findFirst({
            where: {
                userId,
                providerId: PROVIDER_ID,
            },
        });

        if (!account?.accessToken) {
            cleanupSync(userId);
            return new Response(JSON.stringify({ error: "No Google account linked" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Initialize Gmail API client
        const gmail = initializeGmailClient(account.accessToken);

        // Create the sync stream
        const stream = createSyncStream(userId, gmail, batchSize, abortController.signal);

        // Register the sync
        ongoingSyncs.set(userId, { controller: abortController, stream });
        log(`Starting sync for user ${userId} with batch size ${batchSize}`);

        return new Response(stream, {
            headers: {
                "Content-Type": "text/event-stream",
                "Cache-Control": "no-cache",
                Connection: "keep-alive",
            },
        });
    } catch (error) {
        log("Unhandled error in message sync:", error);

        // Clean up ongoing sync flag if there was an error
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            if (session?.user?.id) {
                cleanupSync(session.user.id);
            }
        } catch {}

        return new Response(
            JSON.stringify({
                error: "Failed to start message sync",
                message: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

/**
 * DELETE handler to cancel an ongoing sync
 */
export async function DELETE(request: Request) {
    try {
        // Get user from session
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), {
                status: 401,
                headers: { "Content-Type": "application/json" },
            });
        }

        const userId = session.user.id;

        // Check if there's an ongoing sync to cancel
        if (!ongoingSyncs.has(userId)) {
            return new Response(JSON.stringify({ error: "No ongoing sync found" }), {
                status: 404,
                headers: { "Content-Type": "application/json" },
            });
        }

        // Get the controller and abort the sync
        const { controller } = ongoingSyncs.get(userId) as { controller: AbortController };
        controller.abort();

        // Response will be sent when the stream is closed by the abort handler
        return new Response(
            JSON.stringify({
                success: true,
                message: "Sync cancelled",
            }),
            {
                status: 200,
                headers: { "Content-Type": "application/json" },
            },
        );
    } catch (error) {
        log("Error cancelling sync:", error);

        return new Response(
            JSON.stringify({
                error: "Failed to cancel sync",
                message: error instanceof Error ? error.message : String(error),
            }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            },
        );
    }
}

/**
 * Initialize Gmail API client
 */
function initializeGmailClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

    oauth2Client.setCredentials({
        access_token: accessToken,
    });

    return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Refresh the access token if it's invalid
 */
async function refreshAccessToken(userId: string): Promise<string | null> {
    try {
        log(`Attempting to refresh access token for user ${userId}`);

        // First find the user with related accounts
        const user = await prisma.user.findUnique({
            where: {
                id: userId,
            },
            include: {
                accounts: {
                    where: {
                        providerId: PROVIDER_ID,
                    },
                },
            },
        });

        if (!user) {
            log(`User ${userId} not found`);
            return null;
        }

        if (!user.accounts || user.accounts.length === 0) {
            log(`No ${PROVIDER_ID} accounts found for user ${userId}`);
            return null;
        }

        const account = user.accounts[0];

        log(`Found account: ${account.id}`);

        if (!account.refreshToken) {
            log(`No refresh token found in account ${account.id} for user ${userId}`);
            return null;
        }

        const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

        oauth2Client.setCredentials({
            refresh_token: account.refreshToken,
        });

        log("Requesting new access token with refresh token");
        try {
            const response = await oauth2Client.refreshAccessToken();
            const credentials = response.credentials;

            if (!credentials || !credentials.access_token) {
                log("OAuth refresh response did not contain access token");
                return null;
            }

            // Update the access token in the database
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    accessToken: credentials.access_token,
                },
            });

            log(`Successfully refreshed access token for user ${userId}`);
            return credentials.access_token;
        } catch (refreshError) {
            log(
                `OAuth refresh error: ${refreshError instanceof Error ? refreshError.message : String(refreshError)}`,
            );
            return null;
        }
    } catch (error) {
        log(
            `Error refreshing access token: ${error instanceof Error ? error.message : String(error)}`,
        );
        return null;
    }
}

/**
 * Create a ReadableStream to handle the sync process
 */
function createSyncStream(
    userId: string,
    gmail: gmail_v1.Gmail,
    batchSize: number,
    abortSignal: AbortSignal,
): ReadableStream {
    // Store the gmail client in a mutable variable
    let gmailClient = gmail;

    return new ReadableStream({
        async start(controller) {
            // Handle aborts from the AbortController
            abortSignal.addEventListener("abort", () => {
                log(`Sync aborted for user ${userId}`);
                sendMessage(controller, MESSAGE_TYPES.ERROR, "Sync cancelled by user");
                controller.close();
                cleanupSync(userId);
            });

            try {
                // Get messages in batches to avoid overwhelming the Gmail API
                let pageToken: string | null = null;
                let count = 0;
                let totalMessages = 0;
                let processedMessages = 0;
                let newMessageCount = 0;
                let batchNumber = 1;
                let retryCount = 0;
                const MAX_RETRIES = 3;

                // Arrays to collect all messages before processing
                let allMessages: Array<{
                    id: string;
                    threadId: string;
                    internalDate?: string;
                }> = [];
                let allBatchesComplete = false;

                log(`Starting message sync with batch size ${batchSize}`);

                // Send initial state
                sendMessage(controller, MESSAGE_TYPES.INIT, "Starting message sync (newest first)");

                // First phase: Collect all messages from Gmail API
                sendMessage(
                    controller,
                    MESSAGE_TYPES.BATCH_START,
                    "Starting to collect all messages",
                    {
                        phase: "collection",
                    },
                );

                do {
                    // Check if we've been aborted
                    if (abortSignal.aborted) {
                        log("Aborting sync loop due to cancel request");
                        return;
                    }

                    try {
                        // Query Gmail API for messages
                        const response = await gmailClient.users.messages.list({
                            userId: GMAIL_USER_ID,
                            maxResults: batchSize,
                            pageToken: pageToken || undefined,
                            fields: "messages(id,threadId),nextPageToken,resultSizeEstimate",
                        });

                        // Reset retry count on successful request
                        retryCount = 0;

                        // Extract data with proper typing
                        const messages = (response.data.messages || []) as Array<{
                            id: string;
                            threadId: string;
                        }>;
                        const nextPageToken = response.data.nextPageToken as
                            | string
                            | null
                            | undefined;
                        const resultSizeEstimate = response.data.resultSizeEstimate as
                            | number
                            | undefined;

                        if (count === 0 && resultSizeEstimate) {
                            totalMessages = resultSizeEstimate;

                            // Send total count information
                            sendMessage(
                                controller,
                                MESSAGE_TYPES.COUNT,
                                `Found ${totalMessages} messages to sync`,
                                { count: totalMessages },
                            );
                        }

                        // Add this batch to our collection
                        if (messages.length > 0) {
                            allMessages = [...allMessages, ...messages];

                            // Send progress update for collection phase
                            sendMessage(
                                controller,
                                MESSAGE_TYPES.PROGRESS,
                                `Collected ${allMessages.length} messages so far`,
                                {
                                    collectedMessages: allMessages.length,
                                    totalMessages: Math.max(totalMessages, allMessages.length),
                                    progress: calculateProgress(allMessages.length, totalMessages),
                                    phase: "collection",
                                },
                            );
                        }

                        // Get next page token for pagination
                        pageToken = nextPageToken || null;
                        count++;
                    } catch (error) {
                        // Check if we've been aborted
                        if (abortSignal.aborted) {
                            log("Error occurred but sync was already aborted");
                            return;
                        }

                        // Check if the error is due to invalid credentials
                        const errorMessage = error instanceof Error ? error.message : String(error);

                        // More comprehensive auth error detection
                        const isAuthError =
                            errorMessage.toLowerCase().includes("invalid_grant") ||
                            errorMessage.toLowerCase().includes("invalid credentials") ||
                            errorMessage.toLowerCase().includes("401") ||
                            errorMessage.toLowerCase().includes("auth") ||
                            errorMessage.toLowerCase().includes("token") ||
                            errorMessage.toLowerCase().includes("unauthorized") ||
                            // Google specific error codes
                            errorMessage.includes("invalid_client") ||
                            errorMessage.includes("invalid_request");

                        if (isAuthError && retryCount < MAX_RETRIES) {
                            retryCount++;
                            log(
                                `Authentication error detected (attempt ${retryCount}/${MAX_RETRIES}): ${errorMessage}. Attempting to refresh token.`,
                            );

                            // Try to refresh the token
                            const newAccessToken = await refreshAccessToken(userId);

                            if (newAccessToken) {
                                // Re-initialize the Gmail client with the new token
                                gmailClient = initializeGmailClient(newAccessToken);

                                // Log the retry
                                log("Access token refreshed, retrying the current batch");
                                sendMessage(
                                    controller,
                                    MESSAGE_TYPES.RESUME,
                                    "Refreshed access token, retrying collection",
                                );

                                // Add a short delay before retrying to avoid rate limiting
                                await new Promise((resolve) => setTimeout(resolve, 1000));
                            } else {
                                // If refresh failed, propagate the error
                                log("Failed to refresh token, aborting sync");
                                throw new Error(
                                    "Failed to refresh authentication token. Please sign in again.",
                                );
                            }
                        } else if (retryCount >= MAX_RETRIES) {
                            // Too many retries
                            log(`Exceeded maximum retry attempts (${MAX_RETRIES}), aborting sync`);
                            throw new Error(
                                `Failed to sync after ${MAX_RETRIES} attempts. Please try again later.`,
                            );
                        } else {
                            // For other errors, just propagate
                            throw error;
                        }
                    }
                } while (pageToken);

                // All batches have been collected
                allBatchesComplete = true;
                log(
                    `Collected all ${allMessages.length} messages, now processing in reverse order`,
                );

                // Reverse the messages so newest come first
                allMessages = allMessages.reverse();

                sendMessage(
                    controller,
                    MESSAGE_TYPES.BATCH_COMPLETE,
                    `Completed collection phase. Found ${allMessages.length} messages.`,
                    {
                        collectedMessages: allMessages.length,
                        phase: "collection",
                    },
                );

                // Second phase: Process messages in chunks (newest first)
                sendMessage(
                    controller,
                    MESSAGE_TYPES.BATCH_START,
                    "Starting to process messages (newest first)",
                    {
                        phase: "processing",
                    },
                );

                // Group messages by chunk size for bulk insert
                const messageChunks: Array<Array<{ id: string; threadId: string }>> = [];
                for (let i = 0; i < allMessages.length; i += CHUNK_SIZE) {
                    messageChunks.push(allMessages.slice(i, i + CHUNK_SIZE));
                }

                // Process each chunk
                for (let i = 0; i < messageChunks.length; i++) {
                    const chunk = messageChunks[i];
                    batchNumber = i + 1;

                    // Check for abort between chunks
                    if (abortSignal.aborted) {
                        log("Aborting chunks processing due to cancel request");
                        return;
                    }

                    // Send batch start notification
                    sendMessage(
                        controller,
                        MESSAGE_TYPES.BATCH_START,
                        `Processing batch ${batchNumber} of ${messageChunks.length}`,
                        {
                            batchNumber,
                            totalBatches: messageChunks.length,
                            phase: "processing",
                        },
                    );

                    // Process this batch of messages
                    const result = await processMessageChunk(chunk, userId);

                    // Update counts
                    processedMessages += chunk.length;
                    newMessageCount += result.created;

                    // Calculate progress
                    const progress = calculateProgress(processedMessages, allMessages.length);

                    // Send progress update
                    sendMessage(
                        controller,
                        MESSAGE_TYPES.PROGRESS,
                        `Processed ${processedMessages} messages, ${newMessageCount} new`,
                        {
                            processedMessages,
                            totalMessages: allMessages.length,
                            newMessageCount,
                            progress,
                            phase: "processing",
                        },
                    );

                    // Send save result
                    sendMessage(
                        controller,
                        MESSAGE_TYPES.SAVE_RESULT,
                        `Saved ${result.created} new messages, ${result.existing} existing`,
                        {
                            createdCount: result.created,
                            existingCount: result.existing,
                            batchNumber,
                            totalBatches: messageChunks.length,
                        },
                    );

                    // Send batch complete notification
                    sendMessage(
                        controller,
                        MESSAGE_TYPES.BATCH_COMPLETE,
                        `Completed batch ${batchNumber} of ${messageChunks.length}`,
                        {
                            batchNumber,
                            totalBatches: messageChunks.length,
                            phase: "processing",
                        },
                    );
                }

                // Send completion message
                sendMessage(
                    controller,
                    MESSAGE_TYPES.COMPLETE,
                    `Sync completed. Processed ${processedMessages} messages in reverse order (newest first), found ${newMessageCount} new messages.`,
                    {
                        processedMessages,
                        totalMessages: allMessages.length,
                        newMessageCount,
                    },
                );

                log(
                    `Message sync completed, processed ${processedMessages} messages in reverse order, ${newMessageCount} new`,
                );
                controller.close();
            } catch (error) {
                // Check if we've been aborted before sending error
                if (!abortSignal.aborted) {
                    log("Error in message sync:", error);

                    // Send error message
                    sendMessage(
                        controller,
                        MESSAGE_TYPES.ERROR,
                        error instanceof Error ? error.message : String(error),
                    );
                }

                controller.close();
            } finally {
                // Mark sync as completed
                cleanupSync(userId);
            }
        },
    });
}

/**
 * Process a chunk of messages and save to database
 */
async function processMessageChunk(
    chunk: Array<{ id: string; threadId: string; internalDate?: string }>,
    userId: string,
): Promise<TransactionResult> {
    // Create message data for upserting
    const messageDataToUpsert: MessageData[] = chunk.map((msg) => ({
        id: msg.id,
        threadId: msg.threadId,
        userId,
        createdAt: msg.internalDate || new Date().toISOString(),
    }));

    // Perform database transaction
    return await prisma.$transaction<TransactionResult>(async (tx: any) => {
        // Find existing messages
        const existingMessages = await tx.message.findMany({
            where: {
                id: {
                    in: messageDataToUpsert.map((m) => m.id),
                },
            },
            select: { id: true },
        });

        const existingIds = new Set(existingMessages.map((m: { id: string }) => m.id));
        const newMessages = messageDataToUpsert.filter((m) => !existingIds.has(m.id));

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
}
