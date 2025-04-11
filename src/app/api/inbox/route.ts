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
import { extractContentFromParts } from "@/libs/utils/email-content";
import { withGmailApi } from "../utils/withGmail";

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
 * GET handler for inbox API - Optimized version
 */
export async function GET(request: NextRequest) {
    const startTime = Date.now();
    
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
        const category = searchParams.get("category") || null;
        const skip = (page - 1) * pageSize;

        log(`Fetching inbox for user: ${userId}, page: ${page}, pageSize: ${pageSize}, threadView: ${threadView}, category: ${category}`);

        // Build the base query filters
        const baseFilters: any = { userId };
        
        // Add category filtering to the database query if applicable
        if (category) {
            if (category.toUpperCase() === "STARRED") {
                baseFilters.isStarred = true;
            } else {
                // For other categories, handle the CATEGORY_ prefix
                let labelToMatch = category.toUpperCase();
                if (["SOCIAL", "UPDATES", "FORUMS", "PROMOTIONS", "PERSONAL"].includes(labelToMatch)) {
                    labelToMatch = `CATEGORY_${labelToMatch}`;
                }
                baseFilters.labels = { has: labelToMatch };
            }
        }
        
        // Exclude emails that shouldn't appear in the main inbox
        baseFilters.NOT = {
            labels: {
                hasSome: ["TRASH", "DRAFT", "SPAM"]
            }
        };

        // Build query options based on thread view
        const queryOptions: any = {
            where: baseFilters,
            select: {
                id: true,
                threadId: true,
                subject: true,
                from: true,
                to: true,
                snippet: true,
                isRead: true,
                isStarred: true,
                labels: true,
                internalDate: true,
                aiMetadata: true,
            },
            orderBy: { internalDate: 'desc' as const },
            skip,
            take: pageSize
        };
        
        // Add distinct option for thread view if needed
        if (threadView) {
            queryOptions.distinct = ['threadId'];
        }

        // Message filter - just filter by userId for messages since they don't have labels
        const messageFilters = { userId };

        // Execute queries in parallel to improve performance
        const [emails, totalCount] = await Promise.all([
            prisma.email.findMany(queryOptions),
            threadView 
                ? prisma.message.groupBy({ 
                    by: ['threadId'],
                    where: messageFilters,
                    _count: true
                  })
                : prisma.message.count({ where: messageFilters })
        ]);
        
        log(`Retrieved ${emails.length} emails from database`);
        log(`Total count: ${typeof totalCount === 'number' ? totalCount : totalCount.length}`);
        
        // For debugging
        if (emails.length === 0 && page > 1) {
            // Check if we need to fetch more emails from previous pages
            const checkPreviousEmails = await prisma.email.findMany({
                where: baseFilters,
                select: { id: true },
                take: 5
            });
            log(`Database has ${checkPreviousEmails.length} emails with the current filters`);
            
            // Expand search for this page - remove skip to see if we have any results at all
            const expandedSearch = await prisma.email.findMany({
                where: baseFilters,
                select: { id: true },
                take: pageSize
            });
            log(`Found ${expandedSearch.length} emails when removing pagination skip`);
        }

        // Check for missing emails that need to be fetched from Gmail
        const missingEmails = await checkForMissingEmails(
            userId,
            page,
            pageSize,
            session.user.accessToken ?? null,
            session.user.refreshToken ?? null
        );
        
        if (missingEmails.length > 0) {
            log(`Found ${missingEmails.length} missing emails to fetch from Gmail`);
            
            // Fetch missing emails and merge with existing results
            const fetchedEmails = await fetchMissingEmails(
                missingEmails.map(m => m.id),
                userId,
                session.user.accessToken ?? null,
                session.user.refreshToken ?? null,
                0,
                userId
            );
            
            log(`Successfully fetched ${fetchedEmails.length} emails from Gmail API`);
            
            // Append fetched emails to our results if within the current page bounds
            if (fetchedEmails.length > 0) {
                // For simplicity, we'll re-query to get updated results rather than merging
                const updatedQueryOptions = { ...queryOptions }; // Clone the options
                const updatedEmails = await prisma.email.findMany(updatedQueryOptions);
                emails.splice(0, emails.length, ...updatedEmails);
                log(`Updated emails array with ${emails.length} emails after Gmail fetch`);
            }
        }

        // If we still have no emails for this page but we know there should be more
        // (based on message count), try to fetch more from Gmail
        const totalCountNumber = typeof totalCount === 'number' ? totalCount : totalCount.length;
        if (emails.length === 0 && page > 1 && skip < totalCountNumber) {
            log(`No emails found for page ${page}, but total count is ${totalCountNumber}. Attempting to fetch more.`);
            
            // Get the latest messages from Gmail for this page
            const latestMessages = await withGmailApi(
                userId,
                session.user.accessToken ?? null,
                session.user.refreshToken ?? null,
                async (gmail) => {
                    try {
                        // Get a batch of messages from Gmail
                        const response = await gmail.users.messages.list({
                            userId: GMAIL_USER_ID,
                            maxResults: pageSize,
                            pageToken: String(page) // Use page as token to get different results
                        });
                        return response.data.messages || [];
                    } catch (error) {
                        log("Error fetching messages from Gmail:", error);
                        return [];
                    }
                }
            );
            
            if (latestMessages.length > 0) {
                log(`Found ${latestMessages.length} messages from Gmail API for page ${page}`);
                
                // Fetch these specific messages
                const fetchedEmails = await fetchMissingEmails(
                    latestMessages.map((m: any) => m.id),
                    userId,
                    session.user.accessToken ?? null,
                    session.user.refreshToken ?? null,
                    0,
                    userId
                );
                
                if (fetchedEmails.length > 0) {
                    log(`Fetched ${fetchedEmails.length} emails from Gmail API`);
                    
                    // Query the newly fetched emails
                    const updatedEmails = await prisma.email.findMany({
                        where: {
                            id: { in: fetchedEmails.map(e => e.id) },
                            ...baseFilters
                        },
                        ...queryOptions.select && { select: queryOptions.select },
                        orderBy: { internalDate: 'desc' as const }
                    });
                    
                    if (updatedEmails.length > 0) {
                        log(`Retrieved ${updatedEmails.length} newly fetched emails`);
                        emails.splice(0, emails.length, ...updatedEmails);
                    }
                }
            }
        }

        // Decrypt only necessary fields for display
        const decryptedEmails = emails.map(email => {
            // Create a copy without decryption first
            const decryptedEmail = { ...email };
            
            // Only decrypt subject and snippet for the inbox view
            if (email.subject) {
                try {
                    const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
                    decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
                } catch (error) {
                    decryptedEmail.subject = "[Subject decryption failed]";
                }
            }
            
            if (email.snippet) {
                try {
                    const { encryptedData, iv, authTag } = decodeEncryptedData(email.snippet);
                    decryptedEmail.snippet = decryptText(encryptedData, iv, authTag);
                } catch (error) {
                    decryptedEmail.snippet = "[Snippet decryption failed]";
                }
            }
            
            return decryptedEmail;
        });

        // Handle thread view grouping if needed
        const processedEmails = threadView 
            ? processThreadView(decryptedEmails)
            : decryptedEmails;
        
        // Queue emails missing AI metadata for background processing
        // Don't wait for this to complete
        const emailsNeedingMetadata = emails.filter(email => {
            const metadata = email as unknown as { aiMetadata?: { summary?: string, category?: string } };
            return !metadata.aiMetadata || 
                  (metadata.aiMetadata && (!metadata.aiMetadata.summary || !metadata.aiMetadata.category));
        });
        
        if (emailsNeedingMetadata.length > 0) {
            log(`Queueing ${emailsNeedingMetadata.length} emails for background AI processing`);
            queueBackgroundAIProcessing(emailsNeedingMetadata);
        }

        // Prepare and return the result
        const result = {
            emails: processedEmails,
            hasMore: skip + processedEmails.length < (typeof totalCount === 'number' ? totalCount : totalCount.length),
            totalCount: typeof totalCount === 'number' ? totalCount : totalCount.length,
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
 * Check for emails that might be missing from the database
 * This optimized version only runs when necessary
 */
async function checkForMissingEmails(
    userId: string,
    page: number,
    pageSize: number,
    accessToken: string | null,
    refreshToken: string | null
): Promise<{ id: string }[]> {
    // Only check for missing emails on the first page
    if (page > 1) return [];
    
    try {
        // Check Gmail for latest messages
        const missingIds = await withGmailApi(
            userId,
            accessToken,
            refreshToken,
            async (gmail) => {
                // Get latest messages from Gmail
                const response = await gmail.users.messages.list({
                    userId: GMAIL_USER_ID,
                    maxResults: pageSize,
                });
                
                if (!response.data.messages) {
                    return [];
                }
                
                // Get message IDs from Gmail
                const gmailIds = response.data.messages?.map((m: any) => m.id) || [];
                
                // Check which ones exist in our database
                const existingEmails = await prisma.email.findMany({
                    where: { 
                        id: { in: gmailIds },
                        userId 
                    },
                    select: { id: true }
                });
                
                // Create a set of existing IDs for faster lookups
                const existingIdSet = new Set(existingEmails.map(e => e.id));
                
                // Return IDs that don't exist in our database
                return gmailIds
                    .filter((id: string) => !existingIdSet.has(id))
                    .map((id: string) => ({ id }));
            }
        );
        
        // Update the sync state
        await prisma.syncState.upsert({
            where: { userId },
            update: { lastSyncTime: new Date() },
            create: { 
                userId,
                lastSyncTime: new Date(),
                syncInProgress: false
            }
        });
        
        return missingIds || [];
    } catch (error) {
        log("Error checking for missing emails:", error);
        return [];
    }
}

/**
 * Process emails for thread view
 */
function processThreadView(emails: any[]): any[] {
    if (emails.length === 0) return [];
    
    const threadMap = new Map();
    
    // Group by thread ID and keep the latest email in each thread
    for (const email of emails) {
        const threadId = email.threadId;
        if (
            !threadMap.has(threadId) ||
            new Date(email.internalDate) > new Date(threadMap.get(threadId).internalDate)
        ) {
            threadMap.set(threadId, email);
        }
    }
    
    // Convert to array and sort by internalDate
    return Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime()
    );
}

/**
 * Queue emails for background AI processing
 */
function queueBackgroundAIProcessing(emails: any[]): void {
    if (emails.length === 0) return;
    
    // Start background processing without waiting
    setTimeout(async () => {
        try {
            // Process emails in batches
            const BATCH_SIZE = 5;
            
            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                const batch = emails.slice(i, i + BATCH_SIZE);
                
                // Process each email in the batch
                for (const email of batch) {
                    try {
                        log(`Processing AI metadata for email ${email.id}`);
                        
                        // Dynamically import AI modules to avoid circular dependencies
                        const ai = await import("@/app/ai/new/ai");
                        
                        // Use the enhanceEmail function to process the email
                        await ai.enhanceEmail(email);
                        
                        // Add a small delay between emails to reduce CPU contention
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        log(`Error processing AI metadata for email ${email.id}:`, error);
                    }
                }
                
                // Add a delay between batches
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            log("Error in background AI processing:", error);
        }
    }, 100);
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
                        log(`Failed to enhance email ${email.id}, skipping storage: ${result.error}`);
                        // Skip storing if processing failed
                    } else {
                        log(`Successfully enhanced email ${email.id} with AI metadata`);
                    }

                    // Add a small delay between emails to reduce CPU contention
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (error) {
                    log(`Error processing email ${email.id}, skipping storage:`, error);
                    // Continue with other emails even if one fails, but don't store failed results
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
