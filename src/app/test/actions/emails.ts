"use server";

import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { EmailResponse, getExistingEmails, decryptEmails, storeEmails } from "@/libs/services";
import { fetchEmailsFromGmail, fetchEmailFromGmail, refreshAccessToken } from "@/libs/services";
import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import env from "@/libs/env";
import { Email } from "@/libs/types/email";

const prisma = new PrismaClient();

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
 * Refreshes the access token using the refresh token from the session
 * @param session User session
 * @returns New access token or null if refresh failed
 */
async function refreshTokenFromSession(session: any): Promise<string | null> {
    try {
        if (!session.user.refreshToken) {
            console.error(`[Email Fetch] No refresh token found in session`);
            return null;
        }

        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            env.GOOGLE_CLIENT_ID,
            env.GOOGLE_CLIENT_SECRET
        );

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: session.user.refreshToken
        });

        // Get new access token
        const { credentials } = await oauth2Client.refreshAccessToken();
        
        if (!credentials.access_token) {
            console.error(`[Email Fetch] Failed to refresh access token`);
            return null;
        }

        // Update the account with new access token and expiration
        const account = await prisma.account.findFirst({
            where: {
                userId: session.user.id,
                providerId: 'google'
            }
        });

        if (account) {
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    accessToken: credentials.access_token,
                    accessTokenExpiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : null
                }
            });
        }

        console.log(`[Email Fetch] Successfully refreshed access token`);
        return credentials.access_token;
    } catch (error) {
        console.error(`[Email Fetch] Error refreshing access token:`, error);
        return null;
    }
}

/**
 * Get emails with pagination
 * @param page Page number (1-based)
 * @param pageSize Number of emails per page
 * @returns Paginated emails
 */
export async function getEmails(page: number = 1, pageSize: number = 50): Promise<EmailResponse> {
    const session = await getUser();
    
    if ('error' in session) {
        return {
            error: session.error
        }
    }
    
    if (!session.user) {
        return {
            error: "Authentication failed. Please log in again."
        }
    }
    
    try {
        console.log(`[Email Fetch] Getting emails for page ${page}, size ${pageSize}`);
        
        // Calculate skip for pagination
        const skip = (page - 1) * pageSize;
        
        // Get existing emails from database
        const existingEmails = await prisma.email.findMany({
            where: {
                userId: session.user.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            skip,
            take: pageSize
        });
        
        console.log(`[Email Fetch] Found ${existingEmails.length} existing emails in database`);
        
        // Get total count for pagination
        const totalCount = await prisma.email.count({
            where: {
                userId: session.user.id
            }
        });
        
        console.log(`[Email Fetch] Total emails in database: ${totalCount}`);
        
        // If we don't have enough emails for this page or we're on the first page and have less than 100 emails,
        // fetch more from Gmail
        if (existingEmails.length < pageSize || (page === 1 && totalCount < 100)) {
            console.log(`[Email Fetch] Need to fetch more emails from Gmail API`);
            
            // For first page, fetch more emails to fill the database
            const emailsToFetch = page === 1 ? 100 : pageSize;
            await fetchNewEmails(session, existingEmails, emailsToFetch);
            
            // Get the updated list of emails
            const updatedEmails = await prisma.email.findMany({
                where: {
                    userId: session.user.id
                },
                orderBy: {
                    createdAt: 'desc'
                },
                skip,
                take: pageSize
            });
            
            console.log(`[Email Fetch] After fetching, found ${updatedEmails.length} emails for current page`);
            
            // Get updated total count
            const updatedTotalCount = await prisma.email.count({
                where: {
                    userId: session.user.id
                }
            });
            
            console.log(`[Email Fetch] Updated total emails in database: ${updatedTotalCount}`);
            
            // Decrypt emails before returning
            const decryptedEmails = decryptEmails(updatedEmails);
            
            return {
                messages: decryptedEmails,
                newEmailsCount: updatedTotalCount - totalCount,
                stats: {
                    totalEmails: updatedTotalCount,
                    existingEmails: updatedEmails.length,
                    newEmails: updatedTotalCount - totalCount,
                    fetchTime: 0,
                    currentPage: page,
                    totalPages: Math.ceil(updatedTotalCount / pageSize)
                },
                isComplete: true
            };
        }
        
        // Decrypt emails before returning
        const decryptedEmails = decryptEmails(existingEmails);
        
        return {
            messages: decryptedEmails,
            newEmailsCount: 0,
            stats: {
                totalEmails: totalCount,
                existingEmails: existingEmails.length,
                newEmails: 0,
                fetchTime: 0,
                currentPage: page,
                totalPages: Math.ceil(totalCount / pageSize)
            },
            isComplete: true
        };
    } catch (error) {
        console.error("Error fetching emails:", error);
        throw new Error("Failed to fetch emails. Please try again.");
    }
}

/**
 * Fetches new emails from Gmail API and stores them in the database
 * @param session User session
 * @param existingEmails Existing emails from database
 * @param pageSize Page size for pagination
 */
async function fetchNewEmails(session: any, existingEmails: any[], pageSize: number): Promise<void> {
    const startTime = Date.now();
    
    try {
        // Get existing email IDs
        const existingEmailIds = new Set(existingEmails.map(email => email.id));
        
        // Fetch emails in batches using pagination
        let nextPageToken: string | undefined = undefined;
        let totalFetched = 0;
        let newEmailsCount = 0;
        const maxEmailsToFetch = Math.max(100, pageSize * 2); // Ensure we fetch at least 100 emails or 2 pages worth
        
        do {
            console.log(`[Email Fetch] Fetching batch of emails with pageToken: ${nextPageToken || 'initial'}`);
            
            // Get list of email IDs from Gmail API with pagination
            const { messages: gmailMessages, nextPageToken: newPageToken } = 
                await fetchEmailsFromGmail(session.user.accessToken, 'me', 50, nextPageToken);
            
            nextPageToken = newPageToken;
            
            if (gmailMessages.length === 0) {
                console.log(`[Email Fetch] No more emails found from Gmail API`);
                break;
            }
            
            console.log(`[Email Fetch] Retrieved ${gmailMessages.length} email IDs from Gmail API`);
            
            // Fetch full content for emails not in database
            const emailsToFetch = gmailMessages.filter(
                msg => msg.id && !existingEmailIds.has(msg.id)
            );
            
            console.log(`[Email Fetch] ${emailsToFetch.length} new emails to fetch`);
            
            if (emailsToFetch.length === 0) {
                // If we've fetched all emails, break the loop
                if (!nextPageToken) {
                    console.log(`[Email Fetch] No more pages and no new emails to fetch`);
                    break;
                }
                console.log(`[Email Fetch] No new emails in this batch, continuing to next page`);
                continue;
            }
            
            // Process emails in batches
            const batchSize = 5;
            const newEmails = [];
            
            for (let i = 0; i < emailsToFetch.length; i += batchSize) {
                const batch = emailsToFetch.slice(i, i + batchSize);
                console.log(`[Email Fetch] Processing batch ${i/batchSize + 1} of ${Math.ceil(emailsToFetch.length/batchSize)}`);
                
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
                    newEmailsCount += storedCount;
                    console.log(`[Email Fetch] Stored ${storedCount} new emails in database`);
                }
            }
            
            totalFetched += gmailMessages.length;
            
            // If we've fetched enough emails or there are no more pages, break the loop
            if (totalFetched >= maxEmailsToFetch || !nextPageToken) {
                console.log(`[Email Fetch] Reached fetch limit (${totalFetched} >= ${maxEmailsToFetch}) or no more pages`);
                break;
            }
        } while (nextPageToken);
        
        console.log(`[Email Fetch] Completed in ${Date.now() - startTime}ms. Fetched ${totalFetched} email IDs, stored ${newEmailsCount} new emails.`);
    } catch (error) {
        console.error(`[Email Fetch] Error in background fetch:`, error);
    }
}
