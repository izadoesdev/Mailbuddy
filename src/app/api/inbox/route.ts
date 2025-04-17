import { type NextRequest, NextResponse } from "next/server";
import { prisma, redis } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import {
    decryptText,
    decodeEncryptedData,
} from "@/libs/utils/encryption";
import { enhanceEmail} from "@/app/(dev)/ai/new/ai";
import type { Prisma } from "@prisma/client";
import { checkForMissingEmails, fetchMissingEmails } from "../utils/getFromGmail";
import { PRIORITY_LEVELS } from "@/app/(dev)/ai/new/constants";

// Constants
const PAGE_SIZE = 20;
const EXCLUDED_LABELS = ["TRASH", "DRAFT", "SPAM"];
const CATEGORY_PREFIXED_LABELS = ["SOCIAL", "UPDATES", "FORUMS", "PROMOTIONS", "PERSONAL"];

interface EmailQueryResult {
    emails: any[];
    totalCount: number;
}

async function getTotalCount(userId: string): Promise<number> {
    const total = await redis.get(`total_count_${userId}`);
    if (total) {
        return Number.parseInt(total);
    }
    const totalCount = await prisma.message.count({
        where: { userId },
    });
    redis.set(`total_count_${userId}`, totalCount);
    return totalCount ;
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
    // Only apply specific category filters if not "inbox" and not null
    if (category && category.toLowerCase() !== "inbox") {
        if (category.toUpperCase() === "STARRED") {
            baseFilters.isStarred = true;
        } else {
            let labelToMatch = category.toUpperCase();
            if (CATEGORY_PREFIXED_LABELS.includes(labelToMatch)) {
                labelToMatch = `CATEGORY_${labelToMatch}`;
            }
            baseFilters.labels = { has: labelToMatch };
        }
    } else if (category && category.toLowerCase() === "inbox") {
        // For "inbox" category, specifically look for emails with INBOX label
        baseFilters.labels = { has: "INBOX" };
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

    // Add AI Priority filter to database query if present
    if (aiPriority) {
        let priorityValue = '';
        switch (aiPriority) {
            case 'urgent':
                priorityValue = PRIORITY_LEVELS.URGENT;
                break;
            case 'high':
                priorityValue = PRIORITY_LEVELS.HIGH;
                break;
            case 'medium':
                priorityValue = PRIORITY_LEVELS.MEDIUM;
                break;
            case 'low':
                priorityValue = PRIORITY_LEVELS.LOW;
                break;
        }   

        
        if (priorityValue) {
            baseFilters.aiMetadata = {
                priority: priorityValue
            };
        }
    }
    
    // Add AI Category filter to database query if present
    if (aiCategory) {
        const categorySynonyms = getCategorySynonyms(aiCategory);
        
        // Create an array to hold all the OR conditions for the category search
        const orConditions = [];
        
        // For each synonym, create a condition checking if category field matches
        for (const synonym of categorySynonyms) {
            orConditions.push({
                aiMetadata: {
                    category: {
                        contains: synonym.toLowerCase(),
                        mode: 'insensitive'
                    }
                }
            });
        }
        
        // Add the conditions to the baseFilters
        if (baseFilters.OR) {
            baseFilters.OR = [...baseFilters.OR, ...orConditions];
        } else {
            baseFilters.OR = orConditions;
        }
        
    }

    // First get message IDs from the messages table to ensure complete pagination
    // This approach ensures we paginate based on all messages, not just synced emails
    const messageQuery = {
        where: { userId },
        select: { id: true },
        orderBy: { createdAt: 'desc' as const },
        distinct: ['threadId'] as Prisma.Enumerable<Prisma.MessageScalarFieldEnum>,
        skip,
        take: pageSize
    };

    const messageIds = await prisma.message.findMany(messageQuery);

    const messageIdValues = messageIds.map(m => m.id);

    const totalCount = await getTotalCount(userId);

    if (messageIdValues.length === 0) {
        return { emails: [], totalCount };
    }

    // Now fetch emails with these IDs, applying all filters
    // Note: This might return fewer emails than requested if some don't match filters
    const emailsQueryOptions = {
        where: {
            ...baseFilters,
            id: { in: messageIdValues }
        },
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
    };

    const emails = await prisma.email.findMany(emailsQueryOptions);

    console.log(`Found ${emails.length} emails out of ${messageIdValues.length} messages`);
    return { emails, totalCount };
}

/**
 * Find missing emails by checking messages that exist but don't have a corresponding email
 */
async function findMissingEmails(userId: string, page: number, pageSize: number): Promise<string[]> {
    // Calculate the actual skip based on the page number
    const skip = (page - 1) * pageSize;
    
    // Get the next set of message IDs from the messages table based on skip/limit
    const messages = await prisma.message.findMany({
        where: { userId },
        select: { id: true },
        orderBy: { createdAt: 'desc' },
        distinct: ['threadId'],
        skip,
        take: pageSize
    });

    if (!messages.length) {
        return [];
    }

    // Get the message IDs
    const messageIds = messages.map(msg => msg.id);
    
    // Find which of these IDs are missing from the emails table
    const existingEmails = await prisma.email.findMany({
        where: { 
            id: { in: messageIds },
            userId 
        },
        select: { id: true }
    });
    
    // Create a set of existing email IDs for fast lookup
    const existingEmailIdSet = new Set(existingEmails.map(email => email.id));
    
    // Return the IDs that are in messages but not in emails
    return messageIds.filter(id => !existingEmailIdSet.has(id));
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
 * Decrypt an encrypted field
 */
function decryptField(encryptedValue: string): string {
    try {
        const { encryptedData, iv, authTag } = decodeEncryptedData(encryptedValue);
        return decryptText(encryptedData, iv, authTag);
    } catch (error) {
        console.error("Decryption failed:", error);
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
    
    if (email.from) {
        // Extract both name and email parts from the from field if it contains angle brackets
        // Format: "Some Name" <email@example.com> or Name <email@example.com> or just email@example.com
        const emailRegex = /(.*?)\s*<([^>]+)>/;
        const matches = email.from.match(emailRegex);
        
        if (matches) {
            // If we have both name and email parts
            let fromName = matches[1].trim();
            const fromEmail = matches[2];
            
            // If name is in quotes, remove them
            if (fromName.startsWith('"') && fromName.endsWith('"')) {
                fromName = fromName.substring(1, fromName.length - 1);
            }
            
            // Add new properties for name and email parts
            decryptedEmail.fromName = fromName;
            decryptedEmail.fromEmail = fromEmail;
            
            // Keep the original from value
            decryptedEmail.from = email.from;
        } else {
            // If there's no match, it's likely just an email address
            decryptedEmail.fromName = "";
            decryptedEmail.fromEmail = email.from;
            decryptedEmail.from = email.from;
        }
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
    
    // Group emails by threadId
    const threadMap = new Map<string, any[]>();
    
    for (const email of emails) {
        const threadId = email.threadId;
        if (!threadMap.has(threadId)) {
            threadMap.set(threadId, []);
        }
        threadMap.get(threadId)?.push(email);
    }
    
    // Sort emails within each thread by date
    for (const emailsInThread of threadMap.values()) {
        emailsInThread.sort((a, b) => 
            new Date(b.internalDate || 0).getTime() - new Date(a.internalDate || 0).getTime()
        );
    }
    
    // Create array of thread objects, each containing all its emails
    // Sort threads by the date of their newest email
    const threads = Array.from(threadMap.entries()).map(([threadId, emailsInThread]) => {
        // The first email in the array will be the newest one after sorting
        const newestEmail = emailsInThread[0];
        return {
            threadId,
            emails: emailsInThread,
            // Use newestEmail properties for thread-level display
            subject: newestEmail.subject,
            from: newestEmail.from,
            to: newestEmail.to,
            snippet: newestEmail.snippet,
            isRead: emailsInThread.every(email => email.isRead),
            isStarred: newestEmail.isStarred,
            labels: newestEmail.labels,
            internalDate: newestEmail.internalDate,
            aiMetadata: newestEmail.aiMetadata,
            // Add count of emails in thread
            emailCount: emailsInThread.length
        };
    });
    
    // Sort threads by date of newest email in each thread
    return threads.sort(
        (a, b) => new Date(b.internalDate || 0).getTime() - new Date(a.internalDate || 0).getTime()
    );
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
    const rawCategory = searchParams.get('category');
    // Pass through the raw category, our fetchEmailsFromDb will handle "inbox" properly
    const category = rawCategory;
    const searchQuery = searchParams.get('search');
    
    // Get AI-specific parameters directly from the query
    const aiCategory = searchParams.get('aiCategory');
    const aiPriority = searchParams.get('aiPriority');
    
    // Check if user has a connected Google account
    const googleAccount = await prisma.account.findFirst({
        where: {
            userId,
            providerId: "google",
        },
    });

    if (!googleAccount) {
        return NextResponse.json({
            threads: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false,
            error: "No Gmail account connected",
            errorType: "no_gmail_account"
        });
    }

    // Check if the Google account has valid credentials -- Disabled for now for demo
    // if (!googleAccount.accessToken) {
    //     return NextResponse.json({
    //         threads: [],
    //         totalCount: 0,
    //         page,
    //         pageSize,
    //         hasMore: false,
    //         error: "Gmail account needs to be reconnected",
    //         errorType: "invalid_credentials"
    //     });
    // }

    // Check if user has any messages synced
    const messageCount = await getTotalCount(userId);

    if (messageCount === 0) {
        // Check if sync is in progress
        const syncState = await prisma.syncState.findUnique({
            where: { userId }
        });

        if (syncState?.syncInProgress) {
            return NextResponse.json({
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
                error: "Email sync in progress",
                errorType: "sync_in_progress"
            });
        }
        
        return NextResponse.json({
            threads: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false,
            error: "No emails synced yet",
            errorType: "no_emails_synced"
        });
    }

    try {
        let emails: any[] = [];
        let totalEmailCount = 0;
        // Calculate skip based on page
        const skip = (page - 1) * pageSize;

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
        
        totalEmailCount = totalCount;
        
        // If we have fewer emails than messages, some might need to be synced
        const missingEmailsCount = pageSize - dbEmails.length;

        // 2. Check for missing emails that exist in messages but not in emails table
        if (missingEmailsCount > 0 && !searchQuery && !aiCategory && !aiPriority) {
            try {
                // Find message IDs that exist but don't have emails
                const missingEmailIds = await findMissingEmails(userId, page, pageSize);

                if (missingEmailIds.length > 0) {
                    console.log(`Found ${missingEmailIds.length} emails missing from DB, fetching them`);
                    // Fetch and store missing emails
                    await fetchMissingEmails(
                        missingEmailIds,
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
                    totalEmailCount = retry.totalCount;
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
        const processedThreads = processThreadView(decryptedEmails);
        
        // Find ALL emails missing AI metadata, not just one per thread
        const emailsNeedingEnhancement = decryptedEmails.filter(email => !email.aiMetadata);
        
        if (emailsNeedingEnhancement.length > 0) {
            console.log(`Enhancing ${emailsNeedingEnhancement.length} emails with AI metadata`);
            
            // Process all emails that need enhancement
            const enhancedEmails = await Promise.all(emailsNeedingEnhancement.map(async (email) => {
                try {
                    // Make sure email has userId field required by enhanceEmail
                    const emailWithUserId = {
                        ...email,
                        userId: userId // Ensure userId is set from the session
                    };
                    
                    const enhanced = await enhanceEmail(emailWithUserId);
                    if (enhanced.success && enhanced.data) {
                        return {
                            ...email,
                            aiMetadata: enhanced.data.aiMetadata
                        };
                    }
                } catch (err) {
                    console.warn(`Error enhancing email ${email.id}:`, err);
                }
                return email;
            }));
            
            // Create mapping of enhanced emails by ID for quick lookup
            const enhancedEmailsMap = new Map<string, any>();
            
            // Use for...of instead of forEach
            for (const email of enhancedEmails) {
                if (email?.id) {
                    enhancedEmailsMap.set(email.id, email);
                }
            }
            
            // Update threads with enhanced emails
            const enhancedThreads = processedThreads.map(thread => {
                // Update each email in the thread if it was enhanced
                const updatedEmails = thread.emails.map((email: any) => {
                    if (email?.id && enhancedEmailsMap.has(email.id)) {
                        return enhancedEmailsMap.get(email.id);
                    }
                    return email;
                });
                
                // Update thread with enhanced emails
                return {
                    ...thread,
                    emails: updatedEmails,
                    // Update thread-level aiMetadata from the newest email
                    aiMetadata: updatedEmails[0]?.aiMetadata || thread.aiMetadata
                };
            });
            
            // Use the enhanced threads
            return generateResponse(enhancedThreads, totalEmailCount, page, pageSize);
        }

        // If no enhancement needed, return original threads
        return generateResponse(processedThreads, totalEmailCount, page, pageSize);
    } catch (error) {
        console.error("Error fetching emails:", error);
        return NextResponse.json(
            { error: "Error fetching emails", details: String(error) },
            { status: 500 }
        );
    }
}

/**
 * Generate standardized API response
 */
function generateResponse(threads: any[], totalEmailCount: number, page: number, pageSize: number) {
    // Calculate if there are more emails available based on total count
    const skip = (page - 1) * pageSize;
    const hasMore = (skip + pageSize) < totalEmailCount;

    // Sanitize threads for response
    const sanitizedThreads = threads.map(thread => ({
        ...thread,
        // Also sanitize AI metadata for each email in the thread
        emails: thread.emails.map((email: any) => ({
            ...email,
        }))
    }));

    return NextResponse.json({
        threads: sanitizedThreads,
        totalCount: totalEmailCount,
        page,
        pageSize,
        hasMore
    });
}
