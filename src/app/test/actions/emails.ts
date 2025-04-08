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
  isHtml: boolean;
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
    console.log(`[Email Fetch] Starting email fetch process`);
    
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
        // Get existing emails from database to show immediately
        const existingEmails = await prisma.email.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20
        });
        
        // Return existing emails immediately
        const initialResponse: EmailResponse = {
            messages: existingEmails,
            newEmailsCount: 0,
            stats: {
                totalEmails: existingEmails.length,
                existingEmails: existingEmails.length,
                newEmails: 0,
                fetchTime: Date.now() - startTime
            },
            isComplete: false
        };
        
        // Start fetching new emails in the background
        fetchNewEmails(session, existingEmails).catch(error => {
            console.error(`[Email Fetch] Background fetch error:`, error);
        });
        
        return initialResponse;
    } catch (error: any) {
        console.error(`[Email Fetch] Error:`, error);
        
        // Handle specific error cases
        if (error.status === 401) {
            return {
                error: "Authentication failed. Your session may have expired. Please log out and log in again."
            }
        }
        
        return {
            error: "Failed to fetch emails. Please try again later."
        }
    }
}

// Helper function to decode base64 content
function decodeBase64(data: string) {
    return Buffer.from(data, 'base64').toString();
}

// Helper function to extract email content from parts
function extractContentFromParts(payload: any): { text: string; html: string } {
    const result = { text: '', html: '' };
    
    if (!payload.parts) {
        // Handle single part messages
        if (payload.body && payload.body.data) {
            const content = decodeBase64(payload.body.data);
            if (payload.mimeType === 'text/plain') {
                result.text = content;
            } else if (payload.mimeType === 'text/html') {
                result.html = content;
            }
        }
        return result;
    }
    
    // Process all parts recursively
    for (const part of payload.parts) {
        if (part.mimeType === 'text/plain' && part.body && part.body.data) {
            result.text = decodeBase64(part.body.data);
        } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
            result.html = decodeBase64(part.body.data);
        } else if (part.parts) {
            // Recursively process nested parts
            const nestedContent = extractContentFromParts(part);
            if (nestedContent.text) result.text = nestedContent.text;
            if (nestedContent.html) result.html = nestedContent.html;
        }
    }
    
    return result;
}

// Helper function to get the full message content
async function getFullMessageContent(gmail: any, userId: string, messageId: string): Promise<{ text: string; html: string }> {
    try {
        const fullMessage = await gmail.users.messages.get({
            userId,
            id: messageId,
            format: 'full'
        });

        if (!fullMessage.data || !fullMessage.data.payload) {
            return { text: '', html: '' };
        }

        return extractContentFromParts(fullMessage.data.payload);
    } catch (error) {
        console.error(`[Email Fetch] Error getting full message content:`, error);
        return { text: '', html: '' };
    }
}

async function fetchNewEmails(session: any, existingEmails: any[]): Promise<void> {
    const startTime = Date.now();
    
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: session.user.accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        // Get list of email IDs
        const listResponse = await gmail.users.messages.list({ 
            userId: session.user.email, 
            maxResults: 20 
        });
        
        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            return;
        }
        
        // Get existing email IDs
        const existingEmailIds = new Set(existingEmails.map(email => email.id));
        
        // Fetch full content for emails not in database
        const emailsToFetch = listResponse.data.messages.filter(
            msg => msg.id && !existingEmailIds.has(msg.id)
        );
        
        if (emailsToFetch.length === 0) {
            return;
        }
        
        // Process emails in batches
        const batchSize = 5;
        const newEmails: EmailData[] = [];
        
        for (let i = 0; i < emailsToFetch.length; i += batchSize) {
            const batch = emailsToFetch.slice(i, i + batchSize);
            
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
                    
                    // Get the email content
                    const content = await getFullMessageContent(gmail, session.user.email, msg.id);
                    
                    // Create email object
                    return {
                        id: msg.id,
                        threadId: msg.threadId || '',
                        userId: session.user.id,
                        subject,
                        from,
                        to,
                        snippet: fullMessage.data.snippet || null,
                        body: content.html || content.text || fullMessage.data.snippet || 'No content available',
                        isHtml: !!content.html,
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
                await prisma.email.createMany({
                    data: validResults,
                    skipDuplicates: true
                });
                newEmails.push(...validResults);
            }
        }
        
        console.log(`[Email Fetch] Completed in ${Date.now() - startTime}ms. Fetched ${newEmails.length} new emails.`);
    } catch (error) {
        console.error(`[Email Fetch] Error in background fetch:`, error);
    }
}
