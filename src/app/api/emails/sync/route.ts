import { withGmailApi } from "@/app/api/utils/withGmail";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Email Sync API] ${message}`, ...args);
};

// Gmail user ID for API
const GMAIL_USER_ID = "me";

/**
 * GET handler for testing Gmail synchronization and batch operations
 * This API demonstrates the concepts of partial and full synchronization with Gmail API
 * as described in https://developers.google.com/workspace/gmail/api/guides/sync
 */
export async function GET(request: NextRequest) {
    // Authenticate user
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

    try {
        // Get query parameters
        const searchParams = request.nextUrl.searchParams;
        const syncMode = searchParams.get("mode") || "partial";
        const startHistoryId = searchParams.get("historyId") || null;
        const maxResults = Number.parseInt(searchParams.get("maxResults") || "100", 10);

        log(`Starting ${syncMode} sync for user ${userId}`);

        // Check in database for the latest historyId if not provided
        let storedHistoryId = null;
        if (!startHistoryId && syncMode === "partial") {
            const syncState = await prisma.syncState.findUnique({
                where: { userId },
                select: { historyId: true },
            });

            storedHistoryId = syncState?.historyId || null;
            log(`Using stored history ID: ${storedHistoryId}`);
        }

        // Perform the sync operation based on mode
        if (syncMode === "partial" && (startHistoryId || storedHistoryId)) {
            // Partial sync using history.list
            const historyIdToUse = (startHistoryId || storedHistoryId) as string;
            return await performPartialSync(
                userId,
                accessToken,
                refreshToken,
                historyIdToUse,
                maxResults,
            );
        }

        // Fall through to full sync if partial sync isn't applicable
        return await performFullSync(userId, accessToken, refreshToken, maxResults);
    } catch (error) {
        log("Error during sync:", error);

        // Handle specific auth errors
        if (error instanceof Error && error.message === "AUTH_REFRESH_FAILED") {
            return NextResponse.json(
                { error: "Authentication failed. Please sign in again." },
                { status: 401 },
            );
        }

        // Handle 404 historyId not found error
        if (error instanceof Error && error.message.includes("historyId not found")) {
            return NextResponse.json(
                {
                    error: "History ID not found. Please perform a full sync.",
                    code: "HISTORY_NOT_FOUND",
                },
                { status: 404 },
            );
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}

/**
 * Performs a partial sync using Gmail history.list API
 */
async function performPartialSync(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    historyId: string,
    maxResults: number,
) {
    // First, update sync state to indicate sync is in progress
    await prisma.syncState.upsert({
        where: { userId },
        update: { syncInProgress: true, lastSyncTime: new Date() },
        create: { userId, syncInProgress: true, lastSyncTime: new Date() },
    });

    try {
        const results = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            try {
                // Get history records since the provided historyId
                const historyResponse = await gmail.users.history.list({
                    userId: GMAIL_USER_ID,
                    startHistoryId: historyId,
                    maxResults: maxResults,
                });

                const history = historyResponse.data;

                if (!history.history || history.history.length === 0) {
                    log("No history records found since the provided historyId");

                    // Update sync state
                    if (history.historyId) {
                        await prisma.syncState.update({
                            where: { userId },
                            data: {
                                historyId: history.historyId,
                                lastSyncTime: new Date(),
                                syncInProgress: false,
                            },
                        });
                    }

                    return {
                        success: true,
                        historyId: history.historyId,
                        changed: false,
                        messagesAdded: [],
                        messagesDeleted: [],
                        labelsAdded: [],
                        labelsRemoved: [],
                    };
                }

                // Process the history records to extract changes
                const messagesAdded: string[] = [];
                const messagesDeleted: string[] = [];
                const labelsAdded: Array<{ messageId: string; labelIds: string[] }> = [];
                const labelsRemoved: Array<{ messageId: string; labelIds: string[] }> = [];

                // Process history records
                for (const record of history.history) {
                    // Messages added
                    if (record.messagesAdded) {
                        for (const msg of record.messagesAdded) {
                            if (msg.message?.id && !messagesAdded.includes(msg.message.id)) {
                                messagesAdded.push(msg.message.id);
                            }
                        }
                    }

                    // Messages deleted
                    if (record.messagesDeleted) {
                        for (const msg of record.messagesDeleted) {
                            if (msg.message?.id && !messagesDeleted.includes(msg.message.id)) {
                                messagesDeleted.push(msg.message.id);
                            }
                        }
                    }

                    // Labels added
                    if (record.labelsAdded) {
                        for (const change of record.labelsAdded) {
                            if (change.message?.id && change.labelIds) {
                                labelsAdded.push({
                                    messageId: change.message.id,
                                    labelIds: change.labelIds,
                                });
                            }
                        }
                    }

                    // Labels removed
                    if (record.labelsRemoved) {
                        for (const change of record.labelsRemoved) {
                            if (change.message?.id && change.labelIds) {
                                labelsRemoved.push({
                                    messageId: change.message.id,
                                    labelIds: change.labelIds,
                                });
                            }
                        }
                    }
                }

                // Process new messages - fetch and store in database
                if (messagesAdded.length > 0) {
                    log(`Fetching details for ${messagesAdded.length} new messages`);

                    // Get messages in batches of 10
                    const messagesBatches = [];
                    for (let i = 0; i < messagesAdded.length; i += 10) {
                        const batch = messagesAdded.slice(i, i + 10);
                        messagesBatches.push(batch);
                    }

                    // Process each batch
                    for (const batch of messagesBatches) {
                        // Fetch full message details
                        const batchResults = await Promise.all(
                            batch.map((messageId) =>
                                gmail.users.messages.get({
                                    userId: GMAIL_USER_ID,
                                    id: messageId,
                                    format: "full",
                                }),
                            ),
                        );

                        interface MessageRecord {
                            id: string;
                            threadId: string;
                            userId: string;
                        }

                        interface EmailRecord {
                            id: string;
                            threadId: string;
                            userId: string;
                            subject: string;
                            from: string;
                            to: string;
                            snippet: string;
                            body: string;
                            isRead: boolean;
                            isStarred: boolean;
                            labels: string[];
                            internalDate: string;
                        }

                        const messageRecords: MessageRecord[] = [];
                        const emailRecords: EmailRecord[] = [];

                        // Process each message
                        for (const result of batchResults) {
                            const message = result.data;
                            const headers = message.payload?.headers || [];

                            const from =
                                headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
                            const to =
                                headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";
                            const subject =
                                headers.find((h) => h.name?.toLowerCase() === "subject")?.value ||
                                "";

                            // Extract body content
                            let body = "";
                            const parts = [message.payload];
                            while (parts.length) {
                                const part = parts.shift();
                                if (!part) continue;

                                if (part.mimeType === "text/plain" && part.body?.data) {
                                    // Decode base64
                                    const textData = Buffer.from(part.body.data, "base64").toString(
                                        "utf-8",
                                    );
                                    body = textData;
                                    break;
                                }

                                if (part.mimeType === "text/html" && part.body?.data && !body) {
                                    // Use HTML body if we haven't found plain text yet
                                    const htmlData = Buffer.from(part.body.data, "base64").toString(
                                        "utf-8",
                                    );
                                    body = htmlData;
                                }

                                if (part.parts && Array.isArray(part.parts)) {
                                    // Add nested parts to the queue
                                    parts.push(...part.parts);
                                }
                            }

                            // Determine if message is read and starred from labels
                            const isRead = !message.labelIds?.includes("UNREAD");
                            const isStarred = message.labelIds?.includes("STARRED") || false;

                            // Create records for database insertion
                            messageRecords.push({
                                id: message.id as string,
                                threadId: message.threadId as string,
                                userId,
                            });

                            emailRecords.push({
                                id: message.id as string,
                                threadId: message.threadId as string,
                                userId,
                                subject,
                                from,
                                to,
                                snippet: message.snippet || "",
                                body,
                                isRead,
                                isStarred,
                                labels: message.labelIds || [],
                                internalDate: message.internalDate || Date.now().toString(),
                            });
                        }

                        // Store messages and emails in database
                        if (messageRecords.length > 0) {
                            log(`Storing ${messageRecords.length} new messages in database`);

                            await prisma.$transaction(async (tx) => {
                                // Insert messages first
                                await tx.message.createMany({
                                    data: messageRecords,
                                    skipDuplicates: true,
                                });

                                // Then insert emails
                                await tx.email.createMany({
                                    data: emailRecords,
                                    skipDuplicates: true,
                                });
                            });
                        }
                    }
                }

                // Process label changes
                if (labelsAdded.length > 0 || labelsRemoved.length > 0) {
                    log(
                        `Processing label changes for ${labelsAdded.length + labelsRemoved.length} messages`,
                    );

                    // Get all affected message IDs
                    const affectedMessageIds = [
                        ...new Set([
                            ...labelsAdded.map((item) => item.messageId),
                            ...labelsRemoved.map((item) => item.messageId),
                        ]),
                    ];

                    // Fetch current email records
                    const existingEmails = await prisma.email.findMany({
                        where: {
                            id: { in: affectedMessageIds },
                            userId,
                        },
                        select: {
                            id: true,
                            labels: true,
                            isRead: true,
                            isStarred: true,
                        },
                    });

                    // Create a map for faster lookup
                    const emailMap = new Map();
                    for (const email of existingEmails) {
                        emailMap.set(email.id, email);
                    }

                    // Process label additions
                    for (const { messageId, labelIds } of labelsAdded) {
                        const existingEmail = emailMap.get(messageId);
                        if (!existingEmail) continue;

                        const updatedLabels = [...new Set([...existingEmail.labels, ...labelIds])];
                        const isStarred = labelIds.includes("STARRED")
                            ? true
                            : existingEmail.isStarred;
                        const isRead = labelIds.includes("UNREAD") ? false : existingEmail.isRead;

                        await prisma.email.update({
                            where: { id: messageId },
                            data: {
                                labels: updatedLabels,
                                isStarred,
                                isRead,
                            },
                        });
                    }

                    // Process label removals
                    for (const { messageId, labelIds } of labelsRemoved) {
                        const existingEmail = emailMap.get(messageId);
                        if (!existingEmail) continue;

                        const updatedLabels = existingEmail.labels.filter(
                            (label: string) => !labelIds.includes(label),
                        );
                        const isStarred = labelIds.includes("STARRED")
                            ? false
                            : existingEmail.isStarred;
                        const isRead = labelIds.includes("UNREAD") ? true : existingEmail.isRead;

                        await prisma.email.update({
                            where: { id: messageId },
                            data: {
                                labels: updatedLabels,
                                isStarred,
                                isRead,
                            },
                        });
                    }
                }

                // Process deleted messages
                if (messagesDeleted.length > 0) {
                    log(`Removing ${messagesDeleted.length} deleted messages from database`);

                    await prisma.email.deleteMany({
                        where: {
                            id: { in: messagesDeleted },
                            userId,
                        },
                    });

                    await prisma.message.deleteMany({
                        where: {
                            id: { in: messagesDeleted },
                            userId,
                        },
                    });
                }

                // Save the latest historyId in the database
                if (history.historyId) {
                    await prisma.syncState.update({
                        where: { userId },
                        data: {
                            historyId: history.historyId,
                            lastSyncTime: new Date(),
                            syncInProgress: false,
                        },
                    });

                    log(`Updated historyId to ${history.historyId}`);
                }

                return {
                    success: true,
                    historyId: history.historyId,
                    changed:
                        messagesAdded.length > 0 ||
                        messagesDeleted.length > 0 ||
                        labelsAdded.length > 0 ||
                        labelsRemoved.length > 0,
                    messagesAdded,
                    messagesDeleted,
                    labelsAdded: labelsAdded.length,
                    labelsRemoved: labelsRemoved.length,
                };
            } catch (error: any) {
                // Check if the error is due to historyId not found
                if (error.response && error.response.status === 404) {
                    throw new Error("historyId not found. Full sync required.");
                }
                throw error;
            }
        });

        if (!results) {
            // Update sync state to indicate sync failed
            await prisma.syncState.update({
                where: { userId },
                data: { syncInProgress: false },
            });

            return NextResponse.json({ error: "Failed to perform partial sync" }, { status: 500 });
        }

        return NextResponse.json(results);
    } catch (error) {
        // Update sync state to indicate sync failed
        await prisma.syncState
            .update({
                where: { userId },
                data: { syncInProgress: false },
            })
            .catch((e) => log("Error updating sync state", e));

        throw error;
    }
}

/**
 * Performs a full sync using Gmail messages.list API and batch operations
 */
async function performFullSync(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    maxResults: number,
) {
    // First, update sync state to indicate sync is in progress
    await prisma.syncState.upsert({
        where: { userId },
        update: { syncInProgress: true, lastSyncTime: new Date() },
        create: { userId, syncInProgress: true, lastSyncTime: new Date() },
    });

    try {
        const results = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            // Get the list of messages
            const listResponse = await gmail.users.messages.list({
                userId: GMAIL_USER_ID,
                maxResults: maxResults,
            });

            const messages = listResponse.data.messages || [];

            // The Gmail API doesn't actually return historyId in the list response
            // We'll get it from the first message instead
            let latestHistoryId = null;

            if (messages.length === 0) {
                log("No messages found");
                return {
                    success: true,
                    historyId: latestHistoryId,
                    messageCount: 0,
                    messages: [],
                };
            }

            log(`Found ${messages.length} messages, fetching details in batches`);

            // Fetch message details in batches of 10
            const messagesBatches = [];
            for (let i = 0; i < messages.length; i += 10) {
                const batch = messages.slice(i, i + 10);
                messagesBatches.push(batch);
            }

            const processedMessages = [];
            const savedMessageIds = [];

            // Process each batch
            for (const batch of messagesBatches) {
                // Create a batch of get requests
                const batchResults = await Promise.all(
                    batch.map((msg) =>
                        gmail.users.messages.get({
                            userId: GMAIL_USER_ID,
                            id: msg.id as string,
                            format: "full", // Get full message details
                        }),
                    ),
                );

                // Prepare batch of records to insert
                interface MessageRecord {
                    id: string;
                    threadId: string;
                    userId: string;
                }

                interface EmailRecord {
                    id: string;
                    threadId: string;
                    userId: string;
                    subject: string;
                    from: string;
                    to: string;
                    snippet: string;
                    body: string;
                    isRead: boolean;
                    isStarred: boolean;
                    labels: string[];
                    internalDate: string;
                }

                const messageRecords: MessageRecord[] = [];
                const emailRecords: EmailRecord[] = [];

                // Extract and process the message data
                for (const result of batchResults) {
                    const message = result.data;
                    const headers = message.payload?.headers || [];

                    // Get historyId from the first message if we don't have it yet
                    if (!latestHistoryId && message.historyId) {
                        latestHistoryId = message.historyId;
                    }

                    const from = headers.find((h) => h.name?.toLowerCase() === "from")?.value || "";
                    const to = headers.find((h) => h.name?.toLowerCase() === "to")?.value || "";
                    const subject =
                        headers.find((h) => h.name?.toLowerCase() === "subject")?.value || "";
                    const date = headers.find((h) => h.name?.toLowerCase() === "date")?.value || "";

                    // Extract body content - prefer text/plain if available
                    let body = "";
                    const parts = [message.payload];
                    while (parts.length) {
                        const part = parts.shift();
                        if (!part) continue;

                        if (part.mimeType === "text/plain" && part.body?.data) {
                            // Decode base64
                            const textData = Buffer.from(part.body.data, "base64").toString(
                                "utf-8",
                            );
                            body = textData;
                            break;
                        }

                        if (part.mimeType === "text/html" && part.body?.data && !body) {
                            // Use HTML body if we haven't found plain text yet
                            const htmlData = Buffer.from(part.body.data, "base64").toString(
                                "utf-8",
                            );
                            body = htmlData;
                        }

                        if (part.parts && Array.isArray(part.parts)) {
                            // Add nested parts to the queue
                            parts.push(...part.parts);
                        }
                    }

                    // Determine if message is read and starred from labels
                    const isRead = !message.labelIds?.includes("UNREAD");
                    const isStarred = message.labelIds?.includes("STARRED") || false;

                    // Create records for database insertion
                    const messageRecord = {
                        id: message.id as string,
                        threadId: message.threadId as string,
                        userId,
                    };

                    const emailRecord = {
                        id: message.id as string,
                        threadId: message.threadId as string,
                        userId,
                        subject,
                        from,
                        to,
                        snippet: message.snippet || "",
                        body,
                        isRead,
                        isStarred,
                        labels: message.labelIds || [],
                        internalDate: message.internalDate || Date.now().toString(),
                    };

                    messageRecords.push(messageRecord);
                    emailRecords.push(emailRecord);

                    savedMessageIds.push(message.id);

                    processedMessages.push({
                        id: message.id,
                        threadId: message.threadId,
                        historyId: message.historyId,
                        labelIds: message.labelIds,
                        snippet: message.snippet,
                        internalDate: message.internalDate,
                        from,
                        subject,
                        date,
                    });
                }

                // Store messages and emails in database
                if (messageRecords.length > 0) {
                    log(`Storing ${messageRecords.length} messages in database`);

                    // Use createMany for batch insertion
                    await prisma.$transaction(async (tx) => {
                        // Insert messages first
                        await tx.message.createMany({
                            data: messageRecords,
                            skipDuplicates: true,
                        });

                        // Then insert emails
                        await tx.email.createMany({
                            data: emailRecords,
                            skipDuplicates: true,
                        });
                    });
                }
            }

            // Save the latest historyId in the database
            if (latestHistoryId) {
                await prisma.syncState.update({
                    where: { userId },
                    data: {
                        historyId: latestHistoryId,
                        lastSyncTime: new Date(),
                        syncInProgress: false,
                    },
                });

                log(`Updated historyId to ${latestHistoryId}`);
            }

            return {
                success: true,
                historyId: latestHistoryId,
                messageCount: processedMessages.length,
                savedCount: savedMessageIds.length,
                messages: processedMessages.slice(0, 10), // Only return first 10 messages to keep response size reasonable
            };
        });

        if (!results) {
            // Update sync state to indicate sync failed
            await prisma.syncState.update({
                where: { userId },
                data: { syncInProgress: false },
            });

            return NextResponse.json({ error: "Failed to perform full sync" }, { status: 500 });
        }

        return NextResponse.json(results);
    } catch (error) {
        // Update sync state to indicate sync failed
        await prisma.syncState
            .update({
                where: { userId },
                data: { syncInProgress: false },
            })
            .catch((e) => log("Error updating sync state", e));

        throw error;
    }
}
