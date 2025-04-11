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
import { withGmailApi } from "../utils/withGmail";

// For API requests
const GMAIL_USER_ID = "me";
const PAGE_SIZE = 20; // Default number of emails per page
const FETCH_BATCH_SIZE = 20; // Number of emails to fetch from Gmail at once

// A Map to track active fetches by user ID
const activeUserFetches = new Map<string, { isActive: boolean }>();

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    // console.log(`[Inbox API] ${message}`, ...args);
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
            session.user.refreshToken ?? null,
            0,
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
    // Count distinct thread IDs for the user
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
                    { createdAt: "desc" },
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
                orderBy: { createdAt: "desc" },
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
                orderBy: { createdAt: "desc" },
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
 * Get existing emails from the database
 */
async function getExistingEmails(messageIds: { id: string }[]): Promise<any[]> {
    if (messageIds.length === 0) {
        return [];
    }

    try {
        // Get existing emails from the database
        const emails = await prisma.email.findMany({
            where: {
                id: {
                    in: messageIds.map((m) => m.id),
                },
            },
            include: {
                // Include AI metadata if available
                aiMetadata: true,
            },
            orderBy: {
                internalDate: "desc",
            },
        });

        // Log metadata status
        log(
            `Retrieved ${emails.length} emails, ${emails.filter((e) => e.aiMetadata).length} have AI metadata`,
        );

        // Decrypt sensitive fields
        const decryptedEmails = emails.map((email) => {
            return decryptEmail(email);
        });

        return decryptedEmails;
    } catch (error) {
        log("Error fetching existing emails from database:", error);
        throw error;
    }
}

/**
 * Fetch missing emails from Gmail
 */
async function fetchMissingEmails(
    missingIds: string[],
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
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
                        refreshToken,
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

        // Store emails in vector database for AI search
        // Run this asynchronously without awaiting - don't block the API response
        setTimeout(() => {
            processEmailsForVectorStorage(emails).catch((error) => {
                log("Background vector processing error:", error);
            });
        }, 100);
    } catch (error) {
        log("Error batch storing emails:", error);
        // Continue execution as we've already fetched the emails
    }
}

/**
 * Process emails for vector storage and AI metadata generation in the background
 * This runs asynchronously after the API has already sent its response
 */
async function processEmailsForVectorStorage(emails: any[]): Promise<void> {
    try {
        log(`Starting background vector processing for ${emails.length} emails`);

        // Process emails in batches to avoid overwhelming the system
        const VECTOR_BATCH_SIZE = 5; // Smaller batch size to reduce memory pressure

        for (let i = 0; i < emails.length; i += VECTOR_BATCH_SIZE) {
            const batch = emails.slice(i, i + VECTOR_BATCH_SIZE);

            // Process emails in batch sequentially to avoid memory spikes
            for (const email of batch) {
                try {
                    log(`Enhancing email ${email.id} for user ${email.userId}`);

                    // Dynamically import AI modules to avoid circular dependencies
                    // and ensure we're using the latest version of the module
                    const ai = await import("@/app/ai/new/ai");

                    // Use the enhanceEmail function which will:
                    // 1. Process with Groq to extract metadata
                    // 2. Store in vector database
                    // 3. Save metadata to database
                    const result = await ai.enhanceEmail(email);

                    if (!result.success) {
                        log(`Error enhancing email ${email.id}: ${result.error}`);
                    } else {
                        log(`Successfully enhanced email ${email.id} with AI metadata`);
                    }

                    // Add a small delay between emails to reduce CPU contention
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (error) {
                    log(`Error processing email ${email.id}:`, error);
                    // Continue with other emails even if one fails
                }
            }

            // Add a small delay between batches
            await new Promise((resolve) => setTimeout(resolve, 100));
        }

        log(`Successfully completed background vector processing for ${emails.length} emails`);
    } catch (error) {
        log("Error in background vector processing:", error);
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
 * Process emails for display, merging and formatting as needed
 */
function processEmails(existingEmails: any[], fetchedEmails: any[], threadView: boolean): any[] {
    // Combine existing and fetched emails
    const allEmails = [...existingEmails, ...fetchedEmails];

    if (allEmails.length === 0) {
        return [];
    }

    // For thread view, we want to get the latest email from each thread
    if (threadView) {
        const threadMap = new Map();

        // Group by thread ID and keep the latest email in each thread
        for (const email of allEmails) {
            const threadId = email.threadId;
            if (
                !threadMap.has(threadId) ||
                new Date(email.internalDate) > new Date(threadMap.get(threadId).internalDate)
            ) {
                threadMap.set(threadId, email);
            }
        }

        // Sort threads by most recent email
        return Array.from(threadMap.values()).sort(
            (a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime(),
        );
    }

    // Simple sort by date for non-thread view
    return allEmails.sort(
        (a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime(),
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

    // Ensure AI metadata is preserved (it's not encrypted so we don't need to decrypt)
    if (email.aiMetadata) {
        decryptedEmail.aiMetadata = email.aiMetadata;
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
        console.log(user);

        if (!user || !user.accounts || user.accounts.length === 0) {
            log(`No accounts found for user ${userId}`);
            return null;
        }
        console.log(user.accounts);

        // Get the Google account
        const googleAccount = user.accounts.find((account) => account.providerId === "google");
        if (!googleAccount || !googleAccount.refreshToken) {
            log(`No Google account or refresh token found for user ${userId}`);
            return null;
        }
        console.log(googleAccount);

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
