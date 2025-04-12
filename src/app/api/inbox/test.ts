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
import { enhanceEmail} from "@/app/ai/new/ai";
import { cacheable } from "../utils/cacheable";


const GMAIL_USER_ID = "me";
const PAGE_SIZE = 20;
const FETCH_BATCH_SIZE = 20;

/**
 * Fetch emails from database with caching
 */
const fetchEmailsFromDb = cacheable(
    async (userId: string, page: number, pageSize: number, category: string | null, skip: number) => {
        const baseFilters: any = { userId };
        
        if (category) {
            if (category.toUpperCase() === "STARRED") {
                baseFilters.isStarred = true;
            } else {
                let labelToMatch = category.toUpperCase();
                if (["SOCIAL", "UPDATES", "FORUMS", "PROMOTIONS", "PERSONAL"].includes(labelToMatch)) {
                    labelToMatch = `CATEGORY_${labelToMatch}`;
                }
                baseFilters.labels = { has: labelToMatch };
            }
        }
        
        baseFilters.NOT = {
            labels: {
                hasSome: ["TRASH", "DRAFT", "SPAM"]
            }
        };

        const queryOptions: any = {
            where: baseFilters,
            select: {
                id: true,
                threadId: true,
                subject: true,
                from: true,
                to: true,
                snippet: true,
                body: true,
                isRead: true,
                isStarred: true,
                labels: true,
                internalDate: true,
                aiMetadata: true,
            },
            orderBy: { internalDate: 'desc' as const },
            distinct: ['threadId'],
            skip: skip,
            take: pageSize
        };

        const messageFilters = { userId };

        const [emails, totalCount] = await Promise.all([
            prisma.email.findMany(queryOptions),
            prisma.message.groupBy({ 
                by: ['threadId'],
                where: messageFilters,
                _count: true
            })
        ]);

        return { emails, totalCount };
    },
    { 
        expireInSec: 300, // 5 minutes cache
        prefix: 'user_emails',
        staleWhileRevalidate: true,
        staleTime: 60 // 1 minute before revalidation starts in background
    }
);

/**
 * Get email count with caching
 */
const getEmailCount = cacheable(
    async (userId: string) => {
        const messageFilters = { userId };
        return prisma.message.groupBy({ 
            by: ['threadId'],
            where: messageFilters,
            _count: true
        });
    },
    { 
        expireInSec: 600, // 10 minutes
        prefix: 'user_email_count',
        staleWhileRevalidate: true,
        staleTime: 120 // 2 minutes before revalidation
    }
);

/**
 * Check for missing emails with caching
 */
const checkMissingEmailsCached = cacheable(
    checkForMissingEmails,
    {
        expireInSec: 300, // 5 minutes
        prefix: 'missing_emails',
        staleWhileRevalidate: true,
        staleTime: 60
    }
);

/**
 * GET handler for inbox API
 */
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        const { searchParams } = new URL(request.url);
        const page = Number.parseInt(searchParams.get("page") || "1", 10);
        const pageSize = Number.parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString(), 10);
        const category = searchParams.get("category") || null;
        const skip = (page - 1) * pageSize;

        // Get the total count for this user
        const totalCountResult = await getEmailCount(userId);
        const totalCountNumber = totalCountResult.length;

        // Use cached DB fetch
        let { emails, totalCount } = await fetchEmailsFromDb(userId, page, pageSize, category, skip);
        
        // If no emails found and we're on a higher page, attempt direct fetching from Gmail
        if (emails.length === 0 && page > 1) {
            // Clear cache to ensure we're getting fresh data
            fetchEmailsFromDb.invalidate(userId, page, pageSize, category, skip);
            
            // Attempt to fetch messages directly for this page range
            const startIndex = (page - 1) * pageSize;
            const endIndex = Math.min(page * pageSize, totalCountNumber);
            
            if (startIndex < totalCountNumber) {
                const latestMessages = await withGmailApi(
                    userId,
                    session.user.accessToken ?? null,
                    session.user.refreshToken ?? null,
                    async (gmail) => {
                        try {
                            // Use list with pagination parameters to get specific page
                            const response = await gmail.users.messages.list({
                                userId: GMAIL_USER_ID,
                                maxResults: pageSize,
                                pageToken: searchParams.get("pageToken") || undefined
                            });
                            
                            // Save the next page token if available
                            const nextPageToken = response.data.nextPageToken;
                            
                            return {
                                messages: response.data.messages || [],
                                nextPageToken
                            };
                        } catch (error) {
                            console.error("Error fetching messages:", error);
                            return { messages: [], nextPageToken: null };
                        }
                    }
                );
                
                if (latestMessages && latestMessages.messages.length > 0) {
                    // Fetch the missing emails
                    const fetchedEmails = await fetchMissingEmails(
                        latestMessages.messages.map((m: any) => m.id),
                        userId,
                        session.user.accessToken ?? null,
                        session.user.refreshToken ?? null,
                        userId
                    );
                    
                    if (fetchedEmails.length > 0) {
                        // Re-fetch emails after invalidation and new fetches
                        const refreshedData = await fetchEmailsFromDb(userId, page, pageSize, category, skip);
                        emails = refreshedData.emails;
                        totalCount = refreshedData.totalCount;
                        
                        // If we still don't have emails, use the directly fetched ones
                        if (emails.length === 0) {
                            emails = fetchedEmails;
                        }
                    }
                }
            }
        }

        // Use cached check for missing emails
        const missingEmails = await checkMissingEmailsCached(
            userId,
            page,
            pageSize,
            session.user.accessToken ?? null,
            session.user.refreshToken ?? null
        );
        
        if (missingEmails.length > 0) {
            const fetchedEmails = await fetchMissingEmails(
                missingEmails.map(m => m.id),
                userId,
                session.user.accessToken ?? null,
                session.user.refreshToken ?? null,
                userId
            );
            
            if (fetchedEmails.length > 0) {
                // Invalidate the cache for this user's data
                fetchEmailsFromDb.invalidate(userId, page, pageSize, category, skip);
                
                // Re-fetch emails after cache invalidation
                const { emails: updatedEmails } = await fetchEmailsFromDb(userId, page, pageSize, category, skip);
                emails.splice(0, emails.length, ...updatedEmails);
            }
        }

        // Decrypt and process the emails
        const decryptedEmails = emails.map(email => {
            const decryptedEmail = { ...email };
            
            if (email.subject) {
                try {
                    const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
                    decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
                } catch (error) {
                    decryptedEmail.subject = "[Subject decryption failed]";
                }
            }
            
            if (email.body) {
                try {
                    const { encryptedData, iv, authTag } = decodeEncryptedData(email.body);
                    decryptedEmail.body = decryptText(encryptedData, iv, authTag);
                } catch (error) {
                    decryptedEmail.body = "[Body decryption failed]";
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

        const processedEmails = processThreadView(decryptedEmails);
        
        // Process emails for AI metadata in the background
        if (processedEmails.length > 0) {
            const emailsNeedingMetadata = processedEmails.filter(email => {
                const metadata = email as unknown as { aiMetadata?: { summary?: string, category?: string } };
                return !metadata.aiMetadata || 
                      (metadata.aiMetadata && (!metadata.aiMetadata.summary || !metadata.aiMetadata.category));
            });
            
            if (emailsNeedingMetadata.length > 0) {
                queueBackgroundAIProcessing(emailsNeedingMetadata);
            }
        }

        const result = {
            emails: processedEmails,
            hasMore: skip + processedEmails.length < totalCountNumber,
            totalCount: totalCountNumber,
            page,
            pageSize,
        };

        return NextResponse.json(result);
    } catch (error) {
        console.error("Inbox API error:", error);
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
 */
async function checkForMissingEmails(
    userId: string,
    page: number,
    pageSize: number,
    accessToken: string | null,
    refreshToken: string | null
): Promise<{ id: string }[]> {
    try {
        const messagesNeeded = page * pageSize;
        
        const missingIds = await withGmailApi(
            userId,
            accessToken,
            refreshToken,
            async (gmail) => {
                const response = await gmail.users.messages.list({
                    userId: GMAIL_USER_ID,
                    maxResults: messagesNeeded,
                });
                
                if (!response.data.messages) {
                    return [];
                }
                
                const gmailIds = response.data.messages?.map((m: any) => m.id) || [];
                
                const existingEmails = await prisma.email.findMany({
                    where: { 
                        id: { in: gmailIds },
                        userId 
                    },
                    select: { id: true }
                });
                
                const existingIdSet = new Set(existingEmails.map(e => e.id));
                
                return gmailIds
                    .filter((id: string) => !existingIdSet.has(id))
                    .map((id: string) => ({ id }));
            }
        );
        
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
        return [];
    }
}

/**
 * Process emails for thread view
 */
function processThreadView(emails: any[]): any[] {
    if (emails.length === 0) return [];
    
    const threadMap = new Map();
    
    for (const email of emails) {
        const threadId = email.threadId;
        if (
            !threadMap.has(threadId) ||
            new Date(email.internalDate) > new Date(threadMap.get(threadId).internalDate)
        ) {
            threadMap.set(threadId, email);
        }
    }
    
    return Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.internalDate).getTime() - new Date(a.internalDate).getTime()
    );
}

/**
 * Queue emails for background AI processing
 */
function queueBackgroundAIProcessing(emails: any[]): void {
    if (emails.length === 0) return;
    
    setTimeout(async () => {
        try {
            const BATCH_SIZE = 5;
            
            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                const batch = emails.slice(i, i + BATCH_SIZE);
                
                for (const email of batch) {
                    try {
                        await enhanceEmail(email);
                        // Add small delay between emails to avoid overwhelming the AI API
                        await new Promise(resolve => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error("Failed to enhance email:", error);
                        // Continue with next email
                    }
                }
                
                // Add delay between batches
                await new Promise(resolve => setTimeout(resolve, 200));
            }
        } catch (error) {
            console.error("Background AI processing error:", error);
            // Silent error in background processing
        }
    }, 100);
}

/**
 * Process emails for vector storage
 */
async function processEmailsForVectorStorage(emails: any[]): Promise<void> {
    try {
        const VECTOR_BATCH_SIZE = 5;

        for (let i = 0; i < emails.length; i += VECTOR_BATCH_SIZE) {
            const batch = emails.slice(i, i + VECTOR_BATCH_SIZE);

            for (const email of batch) {
                try {
                    const ai = await import("@/app/ai/new/ai");
                    await ai.enhanceEmail(email);
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (error) {
                    // Skip this email
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    } catch (error) {
        // Silent error
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
    accountUserId = userId,
): Promise<any[]> {
    if (missingIds.length === 0) {
        return [];
    }


    try {
        const messageDetails = await prisma.message.findMany({
            where: { id: { in: missingIds } },
            select: { id: true, threadId: true, createdAt: true },
        });

        const messageDetailsMap = new Map(messageDetails.map((message) => [message.id, message]));
        const fetchedEmails: any[] = [];

        for (let i = 0; i < missingIds.length; i += FETCH_BATCH_SIZE) {

            const batch = missingIds.slice(i, i + FETCH_BATCH_SIZE);
            let batchResults: any[] = [];

            try {
                const messageBatchPromises = batch.map(async (messageId) => {
                    const message = messageDetailsMap.get(messageId);
                    if (!message) return null;

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

                    const headers = fullMessage.data.payload?.headers || [];
                    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
                    const from = headers.find((h: any) => h.name === "From")?.value || "";
                    const to = headers.find((h: any) => h.name === "To")?.value || "";

                    const content = fullMessage.data.payload
                        ? extractContentFromParts(fullMessage.data.payload)
                        : { text: "", html: "" };

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

                batchResults = (await Promise.all(messageBatchPromises)).filter(Boolean) as any[];
                fetchedEmails.push(...batchResults);

                if (batchResults.length > 0) {
                    await storeEmailBatch(batchResults);
                }
            } catch (error) {
                // Continue with next batch
            }
        }

        return fetchedEmails;
    } catch (error) {
        return [];
    }
}

/**
 * Store a batch of emails in the database with encryption
 */
async function storeEmailBatch(emails: any[]): Promise<void> {
    if (emails.length === 0) return;

    try {
        const encryptedEmails = emails.map((email) => encryptEmailFields(email));

        const BATCH_SIZE = 50;
        for (let i = 0; i < encryptedEmails.length; i += BATCH_SIZE) {
            const batch = encryptedEmails.slice(i, i + BATCH_SIZE);
            await prisma.email.createMany({
                data: batch,
                skipDuplicates: true,
            });
        }

        setTimeout(() => {
            processEmailsForVectorStorage(emails).catch(() => {
                // Silently catch errors in background processing
            });
        }, 100);
    } catch (error) {
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

    return {
        ...emailData,
        body: encryptedBody,
        subject: encryptedSubject,
        snippet: encryptedSnippet,
    };
}
