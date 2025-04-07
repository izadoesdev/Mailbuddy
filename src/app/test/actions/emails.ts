"use server";

import { google } from "googleapis";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
const prisma = new PrismaClient();

interface EmailResponse {
  messages?: any[];
  newEmailsCount?: number;
  error?: string;
  stats?: {
    totalEmails: number;
    existingEmails: number;
    newEmails: number;
    fetchTime: number;
    batchCount: number;
  };
  isComplete?: boolean;
}

interface EmailData {
  id: string;
  threadId: string;
  userId: string;
  subject: string;
  from: string;
  to: string;
  snippet: string | null;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
}

async function getUser() {
    const session = await auth.api.getSession({headers: await headers()})
    if (!session) {
        return {
            error: "User not found"
        }
    }
    return session
}

export async function getEmails(): Promise<EmailResponse> {
    const startTime = Date.now();
    console.log(`[Email Fetch] Starting email fetch process at ${new Date().toISOString()}`);
    
    const session = await getUser()
    if ('error' in session) {
        console.error(`[Email Fetch] Authentication error: ${session.error}`);
        return {
            error: session.error
        }
    }
    
    if (!session.user.accessToken) {
        console.error(`[Email Fetch] No access token available for user ${session.user.email}`);
        return {
            error: "Access token not available"
        }
    }
    
    try {
        console.log(`[Email Fetch] Authenticated as user: ${session.user.email}`);
        
        // First, get existing emails from database to show immediately
        console.log(`[Email Fetch] Fetching existing emails from database...`);
        const existingEmails = await prisma.email.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
        
        console.log(`[Email Fetch] Found ${existingEmails.length} existing emails in database`);
        
        // Return existing emails immediately
        const initialResponse: EmailResponse = {
            messages: existingEmails,
            newEmailsCount: 0,
            stats: {
                totalEmails: existingEmails.length,
                existingEmails: existingEmails.length,
                newEmails: 0,
                fetchTime: Date.now() - startTime,
                batchCount: 0
            },
            isComplete: false
        };
        
        // Start fetching new emails in the background
        fetchNewEmails(session, existingEmails).catch(error => {
            console.error(`[Email Fetch] Background fetch error:`, error);
        });
        
        return initialResponse;
    } catch (error: any) {
        const endTime = Date.now();
        console.error(`[Email Fetch] Error after ${endTime - startTime}ms:`, error);
        
        // Handle specific error cases
        if (error.status === 401) {
            console.error(`[Email Fetch] Authentication error (401): Session may have expired`);
            return {
                error: "Authentication failed. Your session may have expired. Please log out and log in again."
            }
        }
        
        return {
            error: "Failed to fetch emails. Please try again later."
        }
    }
}

async function fetchNewEmails(session: any, existingEmails: any[]): Promise<void> {
    const startTime = Date.now();
    console.log(`[Email Fetch] Starting background fetch of new emails`);
    
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: session.user.accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        // Get list of email IDs
        console.log(`[Email Fetch] Fetching email list from Gmail API...`);
        const listResponse = await gmail.users.messages.list({ 
            userId: session.user.email, 
            maxResults: 20 
        });
        
        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            console.log(`[Email Fetch] No emails found for user ${session.user.email}`);
            return;
        }
        
        const totalEmails = listResponse.data.messages.length;
        console.log(`[Email Fetch] Found ${totalEmails} emails from Gmail API`);
        
        // Get existing email IDs
        const existingEmailIds = new Set(existingEmails.map(email => email.id));
        
        // Fetch full content for emails not in database
        const emailsToFetch = listResponse.data.messages.filter(
            msg => msg.id && !existingEmailIds.has(msg.id)
        );
        
        console.log(`[Email Fetch] Need to fetch ${emailsToFetch.length} new emails from Gmail API`);
        
        if (emailsToFetch.length === 0) {
            console.log(`[Email Fetch] No new emails to fetch`);
            return;
        }
        
        // Process emails in larger batches to improve performance
        const batchSize = 5;
        const newEmails: EmailData[] = [];
        const batchCount = Math.ceil(emailsToFetch.length / batchSize);
        
        for (let i = 0; i < emailsToFetch.length; i += batchSize) {
            const batchNumber = Math.floor(i / batchSize) + 1;
            const batch = emailsToFetch.slice(i, i + batchSize);
            console.log(`[Email Fetch] Processing batch ${batchNumber}/${batchCount} (${batch.length} emails)...`);
            
            const batchStartTime = Date.now();
            const batchPromises = batch.map(async (msg) => {
                if (!msg.id) return null;
                
                try {
                    const fullMessage = await gmail.users.messages.get({
                        userId: session.user.email,
                        id: msg.id,
                        format: 'full'
                    });
                    
                    if (!fullMessage.data) {
                        return null;
                    }
                    
                    // Extract email details
                    const headers = fullMessage.data.payload?.headers || [];
                    const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
                    const from = headers.find((h: any) => h.name === 'From')?.value || '';
                    const to = headers.find((h: any) => h.name === 'To')?.value || '';
                    
                    // Get email body
                    let body = '';
                    if (fullMessage.data.snippet) {
                        body = fullMessage.data.snippet;
                    } else if (fullMessage.data.payload?.body?.data) {
                        body = Buffer.from(fullMessage.data.payload.body.data, 'base64').toString();
                    }
                    
                    // Create email object without database operation
                    return {
                        id: msg.id,
                        threadId: msg.threadId || '',
                        userId: session.user.id,
                        subject,
                        from,
                        to,
                        snippet: fullMessage.data.snippet || null,
                        body,
                        isRead: fullMessage.data.labelIds?.includes('UNREAD') ? false : true,
                        isStarred: fullMessage.data.labelIds?.includes('STARRED') || false,
                        labels: fullMessage.data.labelIds || [],
                    } as EmailData;
                } catch (error) {
                    console.error(`[Email Fetch] Error fetching email ${msg.id}:`, error);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            const validResults = batchResults.filter((result): result is EmailData => result !== null);
            
            // Bulk insert emails to database
            if (validResults.length > 0) {
                console.log(`[Email Fetch] Storing ${validResults.length} emails in database...`);
                await prisma.email.createMany({
                    data: validResults,
                    skipDuplicates: true
                });
                console.log(`[Email Fetch] Successfully stored ${validResults.length} emails in database`);
            }
            
            newEmails.push(...validResults);
            
            const batchEndTime = Date.now();
            console.log(`[Email Fetch] Batch ${batchNumber}/${batchCount} completed in ${batchEndTime - batchStartTime}ms`);
            
            // Add a small delay between batches to avoid rate limits
            if (i + batchSize < emailsToFetch.length) {
                console.log(`[Email Fetch] Waiting 500ms before next batch...`);
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }
        
        const endTime = Date.now();
        console.log(`[Email Fetch] Background email fetch completed in ${endTime - startTime}ms`);
        console.log(`[Email Fetch] Fetched ${newEmails.length} new emails`);
        
    } catch (error) {
        console.error(`[Email Fetch] Background fetch error:`, error);
    }
}
