import { type gmail_v1, google } from "googleapis";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { prisma } from "@/libs/db";
import { NextResponse } from "next/server";
import type { GaxiosResponse } from "gaxios";
import { withGmailApi } from "../../utils/withGmail";
import env from "@/libs/env";

// Constants
const GMAIL_USER_ID = "me";
const PROVIDER_ID = "google";
const BATCH_SIZE = 500; // Fetch 500 at a time

/**
 * Fetch all Gmail messages recursively with 500 per page
 */
async function fetchAllMessages(gmail: gmail_v1.Gmail) {
    let allMessages: any[] = [];
    let pageToken: string | null = null;
    let batchCount = 0;
    
    do {
        batchCount++;
        console.log(`Fetching batch #${batchCount}, current count: ${allMessages.length}`);
        
        const response: GaxiosResponse<any> = await gmail.users.messages.list({
            userId: GMAIL_USER_ID,
            maxResults: BATCH_SIZE,
            pageToken: pageToken || undefined,
        });
        
        const messages = response.data.messages || [];
        allMessages = [...allMessages, ...messages];
        
        // Get next page token
        pageToken = response.data.nextPageToken || null;
        
        // Log progress
        console.log(`Batch #${batchCount} complete, fetched ${messages.length} messages. Total: ${allMessages.length}`);
        
    } while (pageToken);
    
    console.log(`All batches complete. Total messages: ${allMessages.length}`);
    return allMessages;
}

/**
 * Fetch a single message's full details
 */
async function fetchMessageDetails(
    gmail: gmail_v1.Gmail, 
    messageId: string
) {
    try {
        const message = await gmail.users.messages.get({
            userId: GMAIL_USER_ID,
            id: messageId,
        });
        
        return message.data;
    } catch (error) {
        console.error(`Error fetching message ${messageId}:`, error);
        return null;
    }
}

/**
 * Format message data for display
 */
function formatMessageData(message: any) {
    if (!message) return null;
    
    return {
        id: message.id,
        threadId: message.threadId,
        internalDate: message.internalDate,
        formattedDate: message.internalDate 
            ? new Date(Number(message.internalDate)).toISOString()
            : null,
        subject: message.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || 'No Subject',
        from: message.payload?.headers?.find((h: any) => h.name === 'From')?.value || '',
        hasLabels: Boolean(message.labelIds?.length),
        snippet: message.snippet
    };
}

/**
 * Store messages in the database
 */
async function storeMessagesInDb(messages: any[], userId: string): Promise<{ created: number; existing: number }> {
    // Prepare message data for database
    const messageData = messages.map(msg => ({
        id: msg.id,
        threadId: msg.threadId,
        userId,
        // We don't have internalDate from list API, so use current timestamp
        createdAt: new Date().toISOString()
    }));
    
    console.log(`Preparing to store ${messageData.length} messages in the database`);
    
    try {
        // Perform database transaction
        return await prisma.$transaction(async (tx: any) => {
            // Find existing messages
            const existingMessages = await tx.message.findMany({
                where: {
                    id: {
                        in: messageData.map(m => m.id),
                    },
                },
                select: { id: true },
            });

            const existingIds = new Set(existingMessages.map((m: { id: string }) => m.id));
            const newMessages = messageData.filter(m => !existingIds.has(m.id));

            console.log(`Found ${existingIds.size} existing messages, will create ${newMessages.length} new messages`);
            
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
    } catch (error) {
        console.error('Error storing messages in database:', error);
        throw error;
    }
}

export async function GET(request: Request) {
    try {
        // Check if we should store in database
        const url = new URL(request.url);
        const storeInDb = url.searchParams.get("store") === "true";
        
        // Get user from session
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const userId = session.user.id;

        // Get the user's Google account
        const account = await prisma.account.findFirst({
            where: {
                userId,
                providerId: PROVIDER_ID,
            },
        });

        if (!account?.accessToken) {
            return NextResponse.json({ error: "No Google account linked" }, { status: 400 });
        }

        // Fetch all messages until there's no more
        console.log(`Starting to fetch all messages using batch size of ${BATCH_SIZE}...`);
        const startTime = Date.now();
        
        // Use the withGmailApi helper to handle token refreshes
        let allMessages = await withGmailApi(
            userId, 
            account.accessToken, 
            account.refreshToken,
            async (gmail) => {
                return fetchAllMessages(gmail);
            }
        ) || [];
        
        // Reverse the message list (most recent first)
        allMessages = allMessages.reverse();
        
        const duration = Date.now() - startTime;
        
        // Get first and last message details
        let firstMessage = null;
        let lastMessage = null;
        
        if (allMessages.length > 0) {
            // Setup Gmail client
            const gmail = await withGmailApi(
                userId,
                account.accessToken,
                account.refreshToken,
                async (gmail) => {
                    return gmail;
                }
            );
            
            if (gmail) {
                // Get first message (most recent)
                if (allMessages[0]?.id && typeof allMessages[0].id === 'string') {
                    console.log('Fetching first (most recent) message details...');
                    const firstMessageData = await fetchMessageDetails(gmail, allMessages[0].id);
                    firstMessage = formatMessageData(firstMessageData);
                }
                
                // Get last message (oldest)
                if (allMessages.length > 1 && 
                    allMessages[allMessages.length - 1]?.id && 
                    typeof allMessages[allMessages.length - 1].id === 'string') {
                    console.log('Fetching last (oldest) message details...');
                    const lastMessageData = await fetchMessageDetails(
                        gmail, 
                        allMessages[allMessages.length - 1].id
                    );
                    lastMessage = formatMessageData(lastMessageData);
                }
            }
        }
        
        // Store messages in DB if requested
        let dbResult = null;
        if (storeInDb && allMessages.length > 0) {
            console.log('Storing reversed messages in database...');
            dbResult = await storeMessagesInDb(allMessages, userId);
        }

        // Return all messages
        return NextResponse.json({
            totalMessages: allMessages.length,
            fetchDurationMs: duration,
            batchSize: BATCH_SIZE,
            timePerMessage: allMessages.length > 0 ? (duration / allMessages.length).toFixed(2) : 0,
            reversed: true,
            dbStorageResult: dbResult,
            firstMessage, // Most recent message
            lastMessage,  // Oldest message
            messages: allMessages,
            note: storeInDb ? 
                "Messages stored in database in reversed order (newest first)" : 
                "Add ?store=true to the URL to store these messages in the database"
        });
    } catch (error) {
        console.error("Test endpoint error:", error);
        return NextResponse.json({
            error: "Error fetching Gmail messages",
            message: error instanceof Error ? error.message : String(error),
        }, { status: 500 });
    }
}