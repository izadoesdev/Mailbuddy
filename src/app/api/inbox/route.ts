import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import {
    decryptText,
    decodeEncryptedData,
} from "@/libs/utils/encryption";
import { extractContentFromParts } from "@/libs/utils/email-content";
import { withGmailApi } from "../utils/withGmail";
import { enhanceEmail} from "@/app/ai/new/ai";
import type { Prisma } from "@prisma/client";
import type { gmail_v1 } from "googleapis";
import { checkForMissingEmails, fetchMissingEmails } from "../utils/getFromGmail";
import { PRIORITY_LEVELS, EMAIL_CATEGORIES } from "@/app/ai/new/constants";

// Constants
const GMAIL_USER_ID = "me";
const PAGE_SIZE = 20;
const FETCH_BATCH_SIZE = 20;
const EXCLUDED_LABELS = ["TRASH", "DRAFT", "SPAM"];
const CATEGORY_PREFIXED_LABELS = ["SOCIAL", "UPDATES", "FORUMS", "PROMOTIONS", "PERSONAL"];

// Types
interface Email {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to: string;
    snippet: string;
    body: string;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    internalDate: string | null;
    aiMetadata?: any;
    userId?: string;
    createdAt?: Date;
}

interface EmailQueryResult {
    emails: any[];
    totalCount: any[];
}

interface MissingEmailId {
    id: string;
}

interface GmailMessageResponse {
    messages: Array<{id: string}>;
    nextPageToken: string | null;
}

/**
 * Fetch emails from database
 */
async function fetchEmailsFromDb(
    userId: string, 
    pageSize: number, 
    category: string | null, 
    skip: number,
    searchQuery?: string | null,
    aiCategory?: string | null,
    aiPriority?: string | null
): Promise<EmailQueryResult> {
    console.log(`Fetching emails from DB for user ${userId}, skip: ${skip}, take: ${pageSize}`);
    const baseFilters: any = { userId };
    
    // Apply category filters for standard Gmail categories
    if (category && !aiCategory && !aiPriority) {
        if (category.toUpperCase() === "STARRED") {
            baseFilters.isStarred = true;
        } else {
            let labelToMatch = category.toUpperCase();
            if (CATEGORY_PREFIXED_LABELS.includes(labelToMatch)) {
                labelToMatch = `CATEGORY_${labelToMatch}`;
            }
            baseFilters.labels = { has: labelToMatch };
        }
    }

    // Add text search if provided
    if (searchQuery) {
        baseFilters.OR = [
            { subject: { contains: searchQuery, mode: 'insensitive' } },
            { from: { contains: searchQuery, mode: 'insensitive' } },
            { to: { contains: searchQuery, mode: 'insensitive' } },
            { snippet: { contains: searchQuery, mode: 'insensitive' } },
        ];
    }
    
    // Exclude system labels
    baseFilters.NOT = {
        labels: {
            hasSome: EXCLUDED_LABELS
        }
    };

    const queryOptions = {
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
        distinct: ['threadId'] as Prisma.Enumerable<Prisma.EmailScalarFieldEnum>,
        skip,
        take: pageSize
    };

    const [emails, totalCount] = await Promise.all([
        prisma.email.findMany(queryOptions),
        prisma.message.groupBy({ 
            by: ['threadId'] as Prisma.MessageScalarFieldEnum[],
            where: { userId },
            _count: true
        } as any)
    ]);

    // Apply AI metadata filters if needed (client-side filtering as Prisma doesn't support jsonb well)
    let filteredEmails = emails;
    
    // Handle AI priority filtering
    if (aiPriority) {
        switch (aiPriority) {
            case 'urgent':
                filteredEmails = filteredEmails.filter(email => 
                    email.aiMetadata?.priority === PRIORITY_LEVELS.URGENT
                );
                break;
            case 'high':
                filteredEmails = filteredEmails.filter(email => 
                    email.aiMetadata?.priority === PRIORITY_LEVELS.HIGH
                );
                break;
            case 'medium':
                filteredEmails = filteredEmails.filter(email => 
                    email.aiMetadata?.priority === PRIORITY_LEVELS.MEDIUM
                );
                break;
            case 'low':
                filteredEmails = filteredEmails.filter(email => 
                    email.aiMetadata?.priority === PRIORITY_LEVELS.LOW
                );
                break;
        }
    }
    
    // Handle AI category filtering
    if (aiCategory) {
        const categorySynonyms = getCategorySynonyms(aiCategory);
        
        filteredEmails = filteredEmails.filter(email => {
            if (!email.aiMetadata?.category) return false;
            
            const lowerCaseCategory = email.aiMetadata.category.toLowerCase();
            return categorySynonyms.some(synonym => 
                lowerCaseCategory.includes(synonym)
            );
        });
    }

    console.log(`Found ${filteredEmails.length} emails after applying all filters`);
    return { emails: filteredEmails, totalCount };
}

/**
 * Helper to get synonyms for a category name to improve matching
 */
function getCategorySynonyms(category: string): string[] {
    switch (category) {
        case 'work':
            return ['work', 'business', 'professional'];
        case 'financial':
            return ['financial', 'finance', 'bank', 'money', 'payment'];
        case 'events':
            return ['event', 'invitation', 'party', 'meeting'];
        case 'travel':
            return ['travel', 'flight', 'hotel', 'booking', 'trip', 'vacation'];
        case 'newsletters':
            return ['newsletter', 'subscription', 'update'];
        case 'receipts':
            return ['receipt', 'purchase', 'order confirmation'];
        case 'invoices':
            return ['invoice', 'bill', 'payment'];
        case 'shopping':
            return ['shopping', 'purchase', 'order', 'buy'];
        case 'personal':
            return ['personal', 'private', 'individual'];
        case 'social':
            return ['social', 'network', 'community'];
        case 'job':
            return ['job', 'career', 'employment', 'application'];
        default:
            return [category];
    }
}

/**
 * Get thread count for a user
 */
async function getThreadCount(userId: string): Promise<any[]> {
    return prisma.message.groupBy({ 
        by: ['threadId'] as Prisma.MessageScalarFieldEnum[],
        where: { userId },
        _count: true
    } as any);
}

/**
 * Decrypt an encrypted field
 */
function decryptField(encryptedValue: string): string {
    try {
        const { encryptedData, iv, authTag } = decodeEncryptedData(encryptedValue);
        return decryptText(encryptedData, iv, authTag);
    } catch (error) {
        return "[Decryption failed]";
    }
}

/**
 * Decrypt email content
 */
function decryptEmailContent(email: any): any {
    const decryptedEmail = { ...email };
    
    if (email.subject) {
        decryptedEmail.subject = decryptField(email.subject);
    }
    
    if (email.body) {
        decryptedEmail.body = decryptField(email.body);
    }
    
    if (email.snippet) {
        decryptedEmail.snippet = decryptField(email.snippet);
    }
    
    // Make sure isRead flag is consistent with UNREAD label
    if (email.labels?.includes("UNREAD") ?? false) {
        decryptedEmail.isRead = false;
    }
    
    return decryptedEmail;
}

/**
 * Process emails for thread view
 */
function processThreadView(emails: any[]): any[] {
    if (emails.length === 0) return [];
    
    const threadMap = new Map<string, any>();
    
    for (const email of emails) {
        const threadId = email.threadId;
        if (
            !threadMap.has(threadId) ||
            new Date(email.internalDate || 0) > new Date(threadMap.get(threadId)?.internalDate || 0)
        ) {
            threadMap.set(threadId, email);
        }
    }
    
    return Array.from(threadMap.values()).sort(
        (a, b) => new Date(b.internalDate || 0).getTime() - new Date(a.internalDate || 0).getTime()
    );
}
/**
 * Fetch messages from Gmail API with pagination
 */
async function fetchMessagesFromGmail(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    maxResults: number,
    pageToken?: string | null
): Promise<GmailMessageResponse | null> {
    console.log(`Fetching messages from Gmail API, maxResults: ${maxResults}, pageToken: ${pageToken || 'none'}`);
    return withGmailApi(
        userId,
        accessToken,
        refreshToken,
        async (gmail: gmail_v1.Gmail) => {
            try {
                const response = await gmail.users.messages.list({
                    userId: GMAIL_USER_ID,
                    maxResults,
                    pageToken: pageToken || undefined
                });
                
                // Filter out invalid IDs and return with the nextPageToken
                const result = {
                    messages: (response.data.messages || [])
                        .map(m => ({id: m.id || ''}))
                        .filter(m => m.id),
                    nextPageToken: response.data.nextPageToken || null
                };
                
                console.log(`Fetched ${result.messages.length} messages from Gmail API, nextPageToken: ${result.nextPageToken || 'none'}`);
                return result;
            } catch (error) {
                console.error("Error fetching messages:", error);
                return null;
            }
        }
    );
}

/**
 * Fetch emails directly from Gmail with pagination
 */
async function fetchDirectFromGmail(
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    pageSize: number,
    pageToken?: string | null
): Promise<{ emails: any[], nextPageToken: string | null }> {
    try {
        const response = await fetchMessagesFromGmail(
            userId, 
            accessToken, 
            refreshToken, 
            pageSize, 
            pageToken
        );
        
        if (!response?.messages?.length) {
            return { emails: [], nextPageToken: null };
        }
        
        const messageIds = response.messages.map(m => m.id);
        const fetchedEmails = await fetchMissingEmails(
            messageIds,
            userId,
            accessToken,
            refreshToken,
            userId
        );
        
        return {
            emails: fetchedEmails,
            nextPageToken: response.nextPageToken
        };
    } catch (error) {
        console.error("Error fetching emails directly from Gmail:", error);
        return { emails: [], nextPageToken: null };
    }
}

/**
 * GET handler for inbox API
 */
export async function GET(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accessToken = session.user.accessToken ?? null;
    const refreshToken = session.user.refreshToken ?? null;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || `${PAGE_SIZE}`, 10);
    const category = searchParams.get('category');
    const pageToken = searchParams.get('pageToken');
    const searchQuery = searchParams.get('search');
    
    // Get AI-specific parameters directly from the query
    const aiCategory = searchParams.get('aiCategory');
    const aiPriority = searchParams.get('aiPriority');
    
    // If aiCategory or aiPriority weren't provided directly but can be derived from category
    if (!aiCategory && !aiPriority && category) {
        if (category.startsWith('category-')) {
            const derivedAiCategory = category.replace('category-', '');
            // Only use parameters from query string - don't pass category params for API filtering
            // ...
        } else if (category.startsWith('priority-')) {
            const derivedAiPriority = category.replace('priority-', '');
            // Only use parameters from query string - don't pass category params for API filtering
            // ...
        }
    }

    try {
        let emails: any[] = [];
        let nextPageToken: string | null = null;
        const skip = pageToken ? 0 : (page - 1) * pageSize;

        // 1. Fetch from database first
        const { emails: dbEmails, totalCount } = await fetchEmailsFromDb(
            userId, 
            pageSize, 
            category,
            skip, 
            searchQuery,
            aiCategory,
            aiPriority
        );

        // 2. Check for missing emails on Gmail
        if (!searchQuery && dbEmails.length < pageSize && !aiCategory && !aiPriority) {
            try {
                // Check if we need to fetch missing emails
                const missingEmailIds = await checkForMissingEmails(
                    userId,
                    1, // page
                    pageSize,
                    pageToken || undefined, // Convert null to undefined
                    accessToken,
                    refreshToken
                );

                if (missingEmailIds.length > 0) {
                    console.log(`Found ${missingEmailIds.length} emails missing from DB, fetching them`);
                    // Fetch and store missing emails
                    await fetchMissingEmails(
                        missingEmailIds.map(item => item.id),
                        userId,
                        accessToken,
                        refreshToken,
                        userId
                    );
                    
                    // Try DB fetch again to get newly synced emails
                    const retry = await fetchEmailsFromDb(
                        userId, 
                        pageSize, 
                        category, 
                        skip,
                        searchQuery,
                        aiCategory,
                        aiPriority
                    );
                    
                    emails = retry.emails;
                } else {
                    emails = dbEmails;
                }
            } catch (error) {
                console.warn("Error syncing missing emails:", error);
                emails = dbEmails;
            }
        } else {
            emails = dbEmails;
        }

        // 3. Decrypt email content
        const decryptedEmails = emails.map(decryptEmailContent);
        
        // 4. Process for thread view
        const processedEmails = processThreadView(decryptedEmails);
        
        // 5. Try to fetch and attach AI metadata for emails that don't have it yet
        const enhancedEmails = await Promise.all(processedEmails.map(async (email) => {
            if (!email.aiMetadata && !searchQuery && !aiCategory && !aiPriority) {
                try {
                    const enhanced = await enhanceEmail(email);
                    if (enhanced.success && enhanced.data) {
                        return enhanced.data;
                    }
                } catch (err) {
                    console.warn(`Error enhancing email ${email.id}:`, err);
                }
            }
            return email;
        }));

        // 6. Calculate if there are more emails available
        const hasMore = processedEmails.length === pageSize;
        
        // 7. Generate nextPageToken if needed
        if (hasMore) {
            // Use the timestamp of the last email as the next page token
            const lastEmail = processedEmails[processedEmails.length - 1];
            if (lastEmail?.internalDate) {
                nextPageToken = lastEmail.internalDate;
            }
        }

        return NextResponse.json({
            emails: enhancedEmails,
            totalCount: totalCount.length,
            page,
            pageSize,
            hasMore,
            nextPageToken
        });
    } catch (error) {
        console.error("Error fetching emails:", error);
        return NextResponse.json(
            { error: "Error fetching emails", details: String(error) },
            { status: 500 }
        );
    }
}
