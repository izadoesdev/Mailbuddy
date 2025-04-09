import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import {
    encryptText,
    encodeEncryptedData,
    decodeEncryptedData,
    decryptText,
} from "@/libs/utils/encryption";
import { google } from "googleapis";
import { extractContentFromParts } from "@/libs/utils/email-content";
import env from "@/libs/env";

// For API requests
const GMAIL_USER_ID = "me";
const PAGE_SIZE = 20; // Default number of emails per page
const FETCH_BATCH_SIZE = 20; // Number of emails to fetch from Gmail at once

// A Map to track active fetches by user ID
const activeUserFetches = new Map<string, { isActive: boolean }>();

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Inbox API] ${message}`, ...args);
};

/**
 * Check if a fetch is active for a user
 */
function isUserFetchActive(userId: string): boolean {
    return activeUserFetches.get(userId)?.isActive || false;
}

/**
 * Set user fetch status
 */
function setUserFetchStatus(userId: string, isActive: boolean): void {
    activeUserFetches.set(userId, { isActive });
}

/**
 * Gmail API helper that automatically handles token refreshes
 * @param userId The user ID to perform the operation for
 * @param accessToken The initial access token
 * @param apiCall Function that performs the actual Gmail API call
 * @returns The result of the API call
 */
async function withGmailApi<T>(
    userId: string,
    accessToken: string | null,
    apiCall: (gmail: any) => Promise<T>,
    retryCount = 0,
): Promise<T | null> {
    const MAX_RETRY_ATTEMPTS = 1;

    if (!accessToken) {
        log(`No access token available for user ${userId}, attempting to refresh...`);
        const newToken = await refreshAccessToken(userId);
        if (!newToken) {
            log(`Failed to refresh token for user ${userId}`);
            return null;
        }
        accessToken = newToken;
    }

    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // Execute the API call
        return await apiCall(gmail);
    } catch (error: any) {
        // Handle token refresh on 401 Unauthorized errors
        if (error?.response?.status === 401 && retryCount < MAX_RETRY_ATTEMPTS) {
            log(`Received 401 error, refreshing token for user ${userId}...`);
            const newToken = await refreshAccessToken(userId);

            if (newToken) {
                log("Token refreshed successfully, retrying API call...");
                return withGmailApi(userId, newToken, apiCall, retryCount + 1);
            }

            log(`Failed to refresh token for user ${userId} after 401 error`);
            return null;
        }

        // Log and rethrow other errors
        log(`Gmail API error for user ${userId}:`, error);
        throw error;
    }
}

/**
 * GET handler for inbox API
 */
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if fetch is already in progress
    if (isUserFetchActive(userId)) {
        return NextResponse.json({ error: "Fetch already in progress" }, { status: 409 });
    }

    // Mark fetch as active
    setUserFetchStatus(userId, true);

    try {
        // Get request parameters
        const { searchParams } = new URL(request.url);
        const page = Number.parseInt(searchParams.get("page") || "1", 10);
        const pageSize = Number.parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString(), 10);
        const threadView = searchParams.get("threadView") === "true";

        // Calculate offset based on page
        const skip = (page - 1) * pageSize;

        log(
            `Fetching inbox for user: ${userId}, page: ${page}, pageSize: ${pageSize}, threadView: ${threadView}`,
        );

        // Add performance metrics
        const startTime = Date.now();

        // Get total thread count
        const totalCount = await getTotalThreadCount(userId);
        log(`Total thread count: ${totalCount}`);

        // Get message IDs
        const messageIds = await getMessageIds(userId, threadView, pageSize, skip);
        log(`Retrieved ${messageIds.length} message IDs`);

        // Get existing emails from database
        const existingEmails = await getExistingEmails(messageIds);
        log(`Found ${existingEmails.length} existing emails in database`);

        // Find missing emails
        const existingEmailIds = new Set(existingEmails.map((e) => e.id));
        const missingMessageIds = messageIds
            .map((m) => m.id)
            .filter((id) => !existingEmailIds.has(id));
        log(`Need to fetch ${missingMessageIds.length} emails from Gmail API`);

        // Fetch missing emails from Gmail
        const fetchedEmails = await fetchMissingEmails(
            missingMessageIds,
            userId,
            session.user.accessToken ?? null,
            0, // Initial retry count
            userId, // Pass the account user ID for token refresh
        );
        log(`Successfully fetched ${fetchedEmails.length} emails from Gmail API`);

        // Process emails
        const allEmails = processEmails(existingEmails, fetchedEmails, threadView);
        log(`Total emails to display: ${allEmails.length}`);

        // Return the results
        const result = {
            emails: allEmails,
            hasMore: skip + allEmails.length < totalCount,
            totalCount,
            page,
            pageSize,
        };

        log(`Request completed in ${Date.now() - startTime}ms`);

        // Mark fetch as completed before returning
        setUserFetchStatus(userId, false);

        return NextResponse.json(result);
    } catch (error) {
        // Mark fetch as completed even on error
        setUserFetchStatus(userId, false);
        log("Error in inbox retrieval:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}

/**
 * Count total threads for a user
 */
async function getTotalThreadCount(userId: string): Promise<number> {
    const result = await prisma.message.groupBy({
        by: ["threadId"],
        where: { userId },
        _count: true,
    });

    return result.length;
}

/**
 * Get message IDs based on view type and pagination
 */
async function getMessageIds(
    userId: string,
    threadView: boolean,
    pageSize: number,
    skip: number,
): Promise<{ id: string }[]> {
    if (threadView) {
        log(`Thread view: fetching threads with skip=${skip}, take=${pageSize}`);

        try {
            // First try to get thread data from the emails table which is faster
            // and includes more details like internalDate for better sorting
            const threadsFromEmails = await prisma.email.findMany({
                where: { userId },
                select: {
                    id: true,
                    threadId: true,
                    internalDate: true,
                    createdAt: true,
                },
                distinct: ["threadId"],
                orderBy: [
                    // First try to sort by internalDate (Gmail's timestamp) if available
                    { internalDate: "desc" },
                    // Otherwise fall back to our database timestamp
                    { createdAt: "asc" },
                ],
                // Apply pagination at the database level
                skip,
                take: pageSize,
            });

            log(`Found ${threadsFromEmails.length} threads from emails table`);

            if (threadsFromEmails.length > 0) {
                // Return email IDs for the paginated threads
                return threadsFromEmails.map((email) => ({ id: email.id }));
            }

            // Fallback: If no emails are found, try messages table
            log("No emails found in emails table, falling back to messages table");

            // Get all thread IDs for this user with a reasonable limit
            const allThreads = await prisma.message.findMany({
                where: { userId },
                select: {
                    id: true,
                    threadId: true,
                    createdAt: true,
                },
                distinct: ["threadId"],
                orderBy: { createdAt: "asc" },
                // Apply pagination at the database level
                skip,
                take: pageSize,
            });

            log(`Found ${allThreads.length} thread messages from fallback messages table`);

            if (allThreads.length === 0) {
                return [];
            }

            // Return just the IDs
            return allThreads.map((msg) => ({ id: msg.id }));
        } catch (error) {
            log("Error fetching thread messages:", error);
            return [];
        }
    } else {
        log(`Message view: fetching messages directly with skip=${skip}, take=${pageSize}`);

        try {
            // For non-thread view, get all message IDs with pagination
            const messages = await prisma.message.findMany({
                where: { userId },
                select: { id: true },
                orderBy: { createdAt: "asc" },
                skip,
                take: pageSize,
            });

            log(`Found ${messages.length} messages`);
            return messages;
        } catch (error) {
            log("Error fetching direct messages:", error);
            return [];
        }
    }
}

/**
 * Get existing emails from database
 */
async function getExistingEmails(messageIds: { id: string }[]): Promise<any[]> {
    if (messageIds.length === 0) {
        return [];
    }

    const ids = messageIds.map((m) => m.id);
    log(`Looking for emails with IDs: ${ids.join(", ")}`);

    // Only select the fields we need
    const emails = await prisma.email.findMany({
        where: {
            id: {
                in: ids,
            },
        },
        select: {
            id: true,
            threadId: true,
            userId: true,
            subject: true,
            from: true,
            to: true,
            snippet: true,
            body: true,
            isRead: true,
            isStarred: true,
            labels: true,
            internalDate: true,
            createdAt: true,
        },
    });

    log(`Found ${emails.length} emails in database before decryption`);

    // Decrypt emails
    return emails.map((email) => decryptEmail(email));
}

/**
 * Fetch missing emails from Gmail
 */
async function fetchMissingEmails(
    missingIds: string[],
    userId: string,
    accessToken: string | null,
    retryCount = 0,
    accountUserId = userId, // Default to userId if not provided
): Promise<any[]> {
    if (missingIds.length === 0) {
        return [];
    }

    // Check if operation has been cancelled
    if (!isUserFetchActive(userId)) {
        log(`Fetch operation cancelled for user ${userId}`);
        return [];
    }

    try {
        // Batch fetch message details from database to improve performance
        const messageDetails = await prisma.message.findMany({
            where: { id: { in: missingIds } },
            select: { id: true, threadId: true, createdAt: true },
        });

        // Create a map for faster lookups
        const messageDetailsMap = new Map(messageDetails.map((message) => [message.id, message]));

        // Fetch messages in batches to avoid overwhelming Gmail API
        const fetchedEmails: any[] = [];

        // Process in batches to avoid overwhelming Gmail API
        for (let i = 0; i < missingIds.length; i += FETCH_BATCH_SIZE) {
            // Check for cancellation before processing each batch
            if (!isUserFetchActive(userId)) {
                log(`Fetch operation cancelled for user ${userId} during batch processing`);
                return fetchedEmails;
            }

            const batch = missingIds.slice(i, i + FETCH_BATCH_SIZE);
            let batchResults: any[] = [];

            try {
                // Use a map to get batch messages with automatic token refresh
                const messageBatchPromises = batch.map(async (messageId) => {
                    const message = messageDetailsMap.get(messageId);
                    if (!message) return null;

                    // Use the withGmailApi helper to handle token refresh
                    const fullMessage = await withGmailApi(
                        accountUserId,
                        accessToken,
                        async (gmail) => {
                            return gmail.users.messages.get({
                                userId: GMAIL_USER_ID,
                                id: messageId,
                                format: "full",
                            });
                        },
                    );

                    if (!fullMessage?.data) return null;

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
                    return {
                        id: messageId,
                        threadId: message.threadId,
                        userId,
                        subject,
                        from,
                        to,
                        snippet: fullMessage.data.snippet || "",
                        body:
                            content.html ||
                            content.text ||
                            fullMessage.data.snippet ||
                            "No content available",
                        isRead: !fullMessage.data.labelIds?.includes("UNREAD"),
                        isStarred: fullMessage.data.labelIds?.includes("STARRED") || false,
                        labels: fullMessage.data.labelIds || [],
                        internalDate: fullMessage.data.internalDate || null,
                        createdAt: message.createdAt,
                    };
                });

                // Wait for all fetches to complete
                batchResults = (await Promise.all(messageBatchPromises)).filter(Boolean) as any[];
                fetchedEmails.push(...batchResults);

                // Store batch results in database
                if (batchResults.length > 0) {
                    await storeEmailBatch(batchResults);
                }
            } catch (error) {
                log(`Error processing batch ${i / FETCH_BATCH_SIZE + 1}:`, error);
                // Continue with next batch
            }
        }

        return fetchedEmails;
    } catch (error) {
        log("Error in fetchMissingEmails:", error);
        return [];
    }
}

/**
 * Store a batch of emails in the database with encryption
 */
async function storeEmailBatch(emails: any[]): Promise<void> {
    if (emails.length === 0) return;

    try {
        // Encrypt all emails
        const encryptedEmails = emails.map((email) => encryptEmailFields(email));

        // Store in batches of 50 for optimal performance
        const BATCH_SIZE = 50;
        for (let i = 0; i < encryptedEmails.length; i += BATCH_SIZE) {
            const batch = encryptedEmails.slice(i, i + BATCH_SIZE);
            await prisma.email.createMany({
                data: batch,
                skipDuplicates: true,
            });
        }

        log(`Successfully stored ${encryptedEmails.length} emails in database`);
    } catch (error) {
        log("Error batch storing emails:", error);
        // Continue execution as we've already fetched the emails
    }
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

    // Return encrypted email
    return {
        ...emailData,
        body: encryptedBody,
        subject: encryptedSubject,
        snippet: encryptedSnippet,
    };
}

/**
 * Process and sort emails
 */
function processEmails(existingEmails: any[], fetchedEmails: any[], threadView: boolean): any[] {
    // Combine existing and fetched emails
    const allEmails = [...existingEmails, ...fetchedEmails];

    // Sort emails by date
    allEmails.sort((a, b) => {
        // Use internalDate if available, otherwise fall back to createdAt
        const dateA = a.internalDate ? new Date(Number.parseInt(a.internalDate)) : new Date(a.createdAt);
        const dateB = b.internalDate ? new Date(Number.parseInt(b.internalDate)) : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
    });

    // Process for thread view
    if (!threadView) {
        return allEmails;
    }

    // Only keep the most recent email for each thread
    return Object.values(
        allEmails.reduce(
            (threads, email) => {
                const emailDate = email.internalDate
                    ? new Date(Number.parseInt(email.internalDate))
                    : new Date(email.createdAt);

                if (
                    !threads[email.threadId] ||
                    emailDate >
                        (threads[email.threadId].internalDate
                            ? new Date(Number.parseInt(threads[email.threadId].internalDate))
                            : new Date(threads[email.threadId].createdAt))
                ) {
                    threads[email.threadId] = email;
                }
                return threads;
            },
            {} as Record<string, any>,
        ),
    );
}
/**
 * Decrypts an email from the database
 */
function decryptEmail(email: any) {
    const decryptedEmail = { ...email };

    // Decrypt body if it exists
    if (email.body) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.body);
            decryptedEmail.body = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email body ${email.id}:`, error);
            decryptedEmail.body = "[Content decryption failed]";
        }
    }

    // Decrypt subject if it exists
    if (email.subject) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
            decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email subject ${email.id}:`, error);
            decryptedEmail.subject = "[Subject decryption failed]";
        }
    }

    // Decrypt snippet if it exists
    if (email.snippet) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.snippet);
            decryptedEmail.snippet = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email snippet ${email.id}:`, error);
            decryptedEmail.snippet = "[Snippet decryption failed]";
        }
    }

    return decryptedEmail;
}

/**
 * Refresh access token for a user
 */
async function refreshAccessToken(userId: string): Promise<string | null> {
    try {
        // Find the user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { accounts: true },
        });

        if (!user || !user.accounts || user.accounts.length === 0) {
            log(`No accounts found for user ${userId}`);
            return null;
        }

        // Get the Google account
        const googleAccount = user.accounts.find((account) => account.providerId === "google");
        if (!googleAccount || !googleAccount.refreshToken) {
            log(`No Google account or refresh token found for user ${userId}`);
            return null;
        }

        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: googleAccount.refreshToken,
        });

        // Refresh the token
        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;

        if (!newAccessToken) {
            log(`Failed to refresh access token for user ${userId}`);
            return null;
        }

        // Update the access token in the database
        await prisma.account.update({
            where: { id: googleAccount.id },
            data: {
                accessToken: newAccessToken,
            },
        });

        log(`Successfully refreshed access token for user ${userId}`);
        return newAccessToken;
    } catch (error) {
        log(`Error refreshing access token for user ${userId}:`, error);
        return null;
    }
}
