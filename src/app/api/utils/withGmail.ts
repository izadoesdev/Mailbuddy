import { prisma } from "@/libs/db";
import env from "@/libs/env";
import { type gmail_v1, google } from "googleapis";
import { GaxiosResponse, OAuth2Client } from "googleapis-common";

const log = (message: string, ...args: any[]) => {
    console.log(`[Gmail API] ${message}`, ...args);
};

/**
 * Initialize Gmail client for a given access token
 */
export function initializeGmailClient(accessToken: string) {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: accessToken });
    return google.gmail({ version: "v1", auth: oauth2Client });
}

/**
 * Refresh access token for a user
 */
export async function refreshAccessToken(userId: string): Promise<string | null> {
    try {
        const googleAccount = await prisma.account.findFirst({
            where: {
                userId,
                providerId: "google",
            },
            select: {
                id: true,
                refreshToken: true,
            },
        });

        if (!googleAccount?.refreshToken) {
            log(`No valid Google account found for user ${userId}`);
            return null;
        }

        const oauth2Client = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);

        oauth2Client.setCredentials({
            refresh_token: googleAccount.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();
        const newAccessToken = credentials.access_token;

        if (!newAccessToken) {
            log(`Failed to refresh access token for user ${userId}`);
            return null;
        }

        await prisma.account.update({
            where: { id: googleAccount.id },
            data: {
                accessToken: newAccessToken,
                updatedAt: new Date(),
            },
        });

        return newAccessToken;
    } catch (error: any) {
        log(`Error refreshing token for user ${userId}: ${error.message}`);

        if (error.message?.includes("invalid_grant")) {
            log(`Invalid grant error detected for user ${userId}`);
            // Token likely revoked - handle appropriately in your application
        }

        return null;
    }
}

/**
 * Gmail API helper that automatically handles token refreshes
 * @param userId The user ID to perform the operation for
 * @param accessToken The initial access token
 * @param apiCall Function that performs the actual Gmail API call
 * @returns The result of the API call
 */
export async function withGmailApi<T>(
    userId: string,
    initialAccessToken: string | null,
    refreshToken: string | null,
    apiCall: (gmail: gmail_v1.Gmail) => Promise<T>,
    retryCount = 0,
): Promise<T | null> {
    const MAX_RETRY_ATTEMPTS = 1;

    if (retryCount > MAX_RETRY_ATTEMPTS) {
        log(`Exceeded max retry attempts for user ${userId}`);
        return null;
    }

    try {
        let accessToken = initialAccessToken;

        if (!accessToken) {
            accessToken = await refreshAccessToken(userId);

            if (!accessToken) {
                throw new Error("Failed to obtain access token");
            }
        }

        const auth = new google.auth.OAuth2(env.GOOGLE_CLIENT_ID, env.GOOGLE_CLIENT_SECRET);
        auth.setCredentials({ access_token: accessToken });

        const gmail = google.gmail({
            version: "v1",
            auth,
        });

        return await apiCall(gmail);
    } catch (error: any) {
        if (error?.response?.status === 401 && retryCount < MAX_RETRY_ATTEMPTS) {
            const newToken = await refreshAccessToken(userId);

            if (newToken) {
                return withGmailApi(userId, newToken, refreshToken, apiCall, retryCount + 1);
            }

            throw new Error("AUTH_REFRESH_FAILED");
        }

        throw error;
    }
}
