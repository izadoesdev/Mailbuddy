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
    skip: number
): Promise<EmailQueryResult> {
    console.log(`Fetching emails from DB for user ${userId}, skip: ${skip}, take: ${pageSize}`);
    const baseFilters: any = { userId };
    
    // Apply category filters
    if (category) {
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

    console.log(`Found ${emails.length} emails in database`);
    return { emails, totalCount };
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
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const accessToken = session.user.accessToken ?? null;
    const refreshToken = session.user.refreshToken ?? null;

    try {
        // Parse query parameters
        const { searchParams } = new URL(request.url);
        const page = Number.parseInt(searchParams.get("page") || "1", 10);
        const pageSize = Number.parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString(), 10);
        const category = searchParams.get("category") || null;
        const skip = (page - 1) * pageSize;
        const pageToken = searchParams.get("pageToken") || undefined;

        // Get the total count for this user
        const totalCountResult = await getThreadCount(userId);
        const totalThreadCount = totalCountResult.length;
        console.log(`Total thread count: ${totalThreadCount}, Page: ${page}, PageToken: ${pageToken || 'none'}`);

        let emails = [];
        let nextPageToken: string | null = null;
        
        // If we have a page token, use token-based pagination with Gmail API directly
        if (pageToken) {
            console.log("Using token-based pagination with page token:", pageToken);
            const result = await fetchDirectFromGmail(
                userId, 
                accessToken, 
                refreshToken, 
                pageSize, 
                pageToken
            );
            
            emails = result.emails;
            nextPageToken = result.nextPageToken;
        } else {
            // For first page or when coming from database pagination
            // Standard case: fetch from database first
            const { emails: dbEmails } = await fetchEmailsFromDb(userId, pageSize, category, skip);
            emails = dbEmails;
            
            // If no emails found in database or if we've reached the end of database pagination
            if (emails.length === 0) {
                console.log(`No emails found in database for page ${page}, fetching from Gmail`);
                const result = await fetchDirectFromGmail(
                    userId, 
                    accessToken, 
                    refreshToken, 
                    pageSize
                );
                
                emails = result.emails;
                nextPageToken = result.nextPageToken;
            }
            
            // Check for missing emails only on first page to avoid duplicates in token-based pagination
            if (page === 1) {
                const missingEmails = await checkForMissingEmails(
                    userId,
                    page,
                    pageSize,
                    undefined,
                    accessToken,
                    refreshToken
                );
                
                if (missingEmails.length > 0) {
                    console.log(`Found ${missingEmails.length} missing emails, fetching content`);
                    await fetchMissingEmails(
                        missingEmails.map(m => m.id),
                        userId,
                        accessToken,
                        refreshToken,
                        userId
                    );
                    
                    // Re-fetch emails from database
                    const { emails: updatedEmails } = await fetchEmailsFromDb(userId, pageSize, category, skip);
                    if (updatedEmails.length > 0) {
                        emails = updatedEmails;
                    }
                }
            }
        }

        // If we have emails, decrypt and process them
        const decryptedEmails = emails.map(decryptEmailContent);
        const processedEmails = processThreadView(decryptedEmails);
        
        // Prepare result with nextPageToken for client-side pagination
        const result = {
            emails: processedEmails,
            hasMore: nextPageToken !== null,
            totalCount: totalThreadCount,
            page,
            pageSize,
            nextPageToken,
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
