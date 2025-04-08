"use server";

import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { EmailResponse, getExistingEmails, decryptEmails, storeEmails } from "@/libs/services";
import { fetchEmailsFromGmail, fetchEmailFromGmail } from "@/libs/services";

/**
 * Gets the current user session
 * @returns User session or error
 */
async function getUser() {
    const session = await auth.api.getSession({headers: await headers()})
    if (!session) {
        return {
            error: "User not found"
        }
    }
    return session
}

/**
 * Fetches emails for the current user
 * @returns Email response
 */
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
        const existingEmails = await getExistingEmails(session.user.id);
        
        // Decrypt email bodies
        const decryptedEmails = decryptEmails(existingEmails);
        
        // Return existing emails immediately
        const initialResponse: EmailResponse = {
            messages: decryptedEmails,
            newEmailsCount: 0,
            stats: {
                totalEmails: decryptedEmails.length,
                existingEmails: decryptedEmails.length,
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

/**
 * Fetches new emails from Gmail API and stores them in the database
 * @param session User session
 * @param existingEmails Existing emails from database
 */
async function fetchNewEmails(session: any, existingEmails: any[]): Promise<void> {
    const startTime = Date.now();
    
    try {
        // Get list of email IDs from Gmail API
        // Use 'me' for Gmail API and the actual user ID for our database
        const gmailMessages = await fetchEmailsFromGmail(session.user.accessToken, 'me');
        
        if (gmailMessages.length === 0) {
            return;
        }
        
        // Get existing email IDs
        const existingEmailIds = new Set(existingEmails.map(email => email.id));
        
        // Fetch full content for emails not in database
        const emailsToFetch = gmailMessages.filter(
            msg => msg.id && !existingEmailIds.has(msg.id)
        );
        
        if (emailsToFetch.length === 0) {
            return;
        }
        
        // Process emails in batches
        const batchSize = 5;
        const newEmails = [];
        
        for (let i = 0; i < emailsToFetch.length; i += batchSize) {
            const batch = emailsToFetch.slice(i, i + batchSize);
            
            const batchPromises = batch.map(async (msg) => {
                if (!msg.id) return null;
                
                try {
                    // Use 'me' for Gmail API but set the correct userId for our database
                    const emailData = await fetchEmailFromGmail(session.user.accessToken, 'me', msg.id);
                    
                    // Update the userId to match our database user ID
                    if (emailData) {
                        emailData.userId = session.user.id;
                    }
                    
                    return emailData;
                } catch (error) {
                    console.error(`[Email Fetch] Error fetching email ${msg.id}:`, error);
                    return null;
                }
            });
            
            const batchResults = await Promise.all(batchPromises);
            const validResults = batchResults.filter((result): result is NonNullable<typeof result> => result !== null);
            
            // Store emails in database
            if (validResults.length > 0) {
                const storedCount = await storeEmails(validResults);
                newEmails.push(...validResults.slice(0, storedCount));
            }
        }
        
        console.log(`[Email Fetch] Completed in ${Date.now() - startTime}ms. Fetched ${newEmails.length} new emails.`);
    } catch (error) {
        console.error(`[Email Fetch] Error in background fetch:`, error);
    }
}
