import { google } from "googleapis";
import { extractContentFromParts } from "../utils/email-content";
import { prisma } from "@/libs/db";
import env from "../env";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";

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
    internalDate?: string;
}

/**
 * Refreshes the access token using the refresh token
 * @param userId User ID
 * @returns New access token or null if refresh failed
 */
export async function refreshAccessToken(userId: string): Promise<string | null> {
    try {
        // Get the current session which includes the refresh token
        const session = await auth.api.getSession({ headers: await headers() });

        if (!session || !session.user.refreshToken) {
            console.error(`[Gmail Service] No refresh token found for user ${userId}`);
            return null;
        }

        // Set up OAuth2 client
        const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

        // Set refresh token
        oauth2Client.setCredentials({
            refresh_token: session.user.refreshToken,
        });

        // Get new access token
        const { credentials } = await oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
            console.error(`[Gmail Service] Failed to refresh access token for user ${userId}`);
            return null;
        }

        // Update the account with new access token and expiration
        const account = await prisma.account.findFirst({
            where: {
                userId,
                providerId: "google",
            },
        });

        if (account) {
            await prisma.account.update({
                where: { id: account.id },
                data: {
                    accessToken: credentials.access_token,
                    accessTokenExpiresAt: credentials.expiry_date
                        ? new Date(credentials.expiry_date)
                        : null,
                },
            });
        }

        console.log(`[Gmail Service] Successfully refreshed access token for user ${userId}`);
        return credentials.access_token;
    } catch (error) {
        console.error("[Gmail Service] Error refreshing access token:", error);
        return null;
    }
}

/**
 * Gets the full message content from Gmail API
 * @param gmail Gmail API client
 * @param userId User ID (use 'me' for authenticated user)
 * @param messageId Message ID
 * @returns Object containing text and HTML content
 */
export async function getFullMessageContent(
    gmail: any,
    userId: string,
    messageId: string,
): Promise<{ text: string; html: string }> {
    try {
        const fullMessage = await gmail.users.messages.get({
            userId,
            id: messageId,
            format: "full",
        });

        if (!fullMessage.data || !fullMessage.data.payload) {
            return { text: "", html: "" };
        }

        return extractContentFromParts(fullMessage.data.payload);
    } catch (error) {
        console.error("[Gmail Service] Error getting full message content:", error);
        return { text: "", html: "" };
    }
}

/**
 * Fetches emails from Gmail API
 * @param accessToken User's access token
 * @param userId User ID (use 'me' for authenticated user)
 * @param maxResults Maximum number of results to return
 * @param pageToken Token for pagination
 * @returns Object containing messages and nextPageToken
 */
export async function fetchEmailsFromGmail(
    accessToken: string,
    userId: string,
    maxResults = 50,
    pageToken?: string,
): Promise<{ messages: any[]; nextPageToken?: string }> {
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        // Get list of email IDs
        const listResponse = await gmail.users.messages.list({
            userId,
            maxResults,
            pageToken,
        });

        if (!listResponse.data.messages || listResponse.data.messages.length === 0) {
            return { messages: [] };
        }

        return {
            messages: listResponse.data.messages,
            nextPageToken: listResponse.data.nextPageToken || undefined,
        };
    } catch (error: any) {
        console.error("[Gmail Service] Error fetching emails:", error);

        // Check if the error is due to invalid credentials
        if (error.message?.includes("Invalid Credentials")) {
            console.log(
                "[Gmail Service] Invalid credentials detected, attempting to refresh token",
            );

            // Extract the actual user ID from the userId parameter (which might be 'me')
            const dbUserId = userId === "me" ? accessToken.split(".")[0] : userId;

            // Try to refresh the token
            const newAccessToken = await refreshAccessToken(dbUserId);

            if (newAccessToken) {
                console.log("[Gmail Service] Token refreshed successfully, retrying request");
                // Retry the request with the new token
                return fetchEmailsFromGmail(newAccessToken, userId, maxResults, pageToken);
            }
        }

        return { messages: [] };
    }
}

/**
 * Fetches a single email from Gmail API
 * @param accessToken User's access token
 * @param userId User ID (use 'me' for authenticated user)
 * @param messageId Message ID
 * @returns Email data
 */
export async function fetchEmailFromGmail(
    accessToken: string,
    userId: string,
    messageId: string,
): Promise<EmailData | null> {
    try {
        // Set up Gmail API client
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });

        const fullMessage = await gmail.users.messages.get({
            userId,
            id: messageId,
            format: "full",
        });

        if (!fullMessage.data) {
            return null;
        }

        // Extract email details
        const headers = fullMessage.data.payload?.headers || [];
        const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
        const from = headers.find((h: any) => h.name === "From")?.value || "";
        const to = headers.find((h: any) => h.name === "To")?.value || "";

        // Get the email content
        const content = await getFullMessageContent(gmail, userId, messageId);

        // Create email object
        return {
            id: messageId,
            threadId: fullMessage.data.threadId || "",
            userId, // This will be updated in the actions file to use the correct database user ID
            subject,
            from,
            to,
            snippet: fullMessage.data.snippet || null,
            body:
                content.html || content.text || fullMessage.data.snippet || "No content available",
            isRead: !fullMessage.data.labelIds?.includes("UNREAD"),
            isStarred: fullMessage.data.labelIds?.includes("STARRED") || false,
            labels: fullMessage.data.labelIds || [],
            internalDate: fullMessage.data.internalDate || undefined,
        };
    } catch (error: any) {
        console.error(`[Gmail Service] Error fetching email ${messageId}:`, error);

        // Check if the error is due to invalid credentials
        if (error.message?.includes("Invalid Credentials")) {
            console.log(
                "[Gmail Service] Invalid credentials detected, attempting to refresh token",
            );

            // Extract the actual user ID from the userId parameter (which might be 'me')
            const dbUserId = userId === "me" ? accessToken.split(".")[0] : userId;

            // Try to refresh the token
            const newAccessToken = await refreshAccessToken(dbUserId);

            if (newAccessToken) {
                console.log("[Gmail Service] Token refreshed successfully, retrying request");
                // Retry the request with the new token
                return fetchEmailFromGmail(newAccessToken, userId, messageId);
            }
        }

        return null;
    }
}
