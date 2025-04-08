import { google } from "googleapis";
import { extractContentFromParts } from "../utils/email-content";

/**
 * Interface for email data
 */
export interface EmailData {
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

/**
 * Gets the full message content from Gmail API
 * @param gmail Gmail API client
 * @param userId User ID (use 'me' for authenticated user)
 * @param messageId Message ID
 * @returns Object containing text and HTML content
 */
export async function getFullMessageContent(gmail: any, userId: string, messageId: string): Promise<{ text: string; html: string }> {
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
        console.error(`[Gmail Service] Error getting full message content:`, error);
        return { text: '', html: '' };
    }
}

/**
 * Fetches emails from Gmail API
 * @param accessToken User's access token
 * @param userId User ID (use 'me' for authenticated user)
 * @param maxResults Maximum number of results to return
 * @returns Array of email messages
 */
export async function fetchEmailsFromGmail(accessToken: string, userId: string, maxResults: number = 20): Promise<any[]> {
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        // Get list of email IDs
        const listResponse = await gmail.users.messages.list({ 
            userId, 
            maxResults 
        });
        
        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            return [];
        }
        
        return listResponse.data.messages;
    } catch (error) {
        console.error(`[Gmail Service] Error fetching emails:`, error);
        return [];
    }
}

/**
 * Fetches a single email from Gmail API
 * @param accessToken User's access token
 * @param userId User ID (use 'me' for authenticated user)
 * @param messageId Message ID
 * @returns Email data
 */
export async function fetchEmailFromGmail(accessToken: string, userId: string, messageId: string): Promise<EmailData | null> {
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        const fullMessage = await gmail.users.messages.get({
            userId,
            id: messageId,
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
        const content = await getFullMessageContent(gmail, userId, messageId);
        
        // Create email object
        return {
            id: messageId,
            threadId: fullMessage.data.threadId || '',
            userId, // This will be updated in the actions file to use the correct database user ID
            subject,
            from,
            to,
            snippet: fullMessage.data.snippet || null,
            body: content.html || content.text || fullMessage.data.snippet || 'No content available',
            isRead: fullMessage.data.labelIds?.includes('UNREAD') ? false : true,
            isStarred: fullMessage.data.labelIds?.includes('STARRED') || false,
            labels: fullMessage.data.labelIds || []
        };
    } catch (error) {
        console.error(`[Gmail Service] Error fetching email ${messageId}:`, error);
        return null;
    }
} 