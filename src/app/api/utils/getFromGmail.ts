import { enhanceEmail } from "@/app/(dev)/ai/new/ai";
import { prisma } from "@/libs/db";
import { encodeEncryptedData, encryptText, extractContentFromParts } from "@/libs/utils";
import type { gmail_v1 } from "googleapis";
import { withGmailApi } from "./withGmail";

// Constants
const GMAIL_USER_ID = "me";
const FETCH_BATCH_SIZE = 20;

/**
 * Extract email headers from Gmail message
 */
function extractEmailHeaders(headers: any[] = []): { subject: string; from: string; to: string } {
    return {
        subject: headers.find((h) => h.name === "Subject")?.value || "",
        from: headers.find((h) => h.name === "From")?.value || "",
        to: headers.find((h) => h.name === "To")?.value || "",
    };
}

/**
 * Check for emails that might be missing from the database
 */
export async function checkForMissingEmails(
    userId: string,
    page: number,
    pageSize: number,
    pageToken: string | undefined,
    accessToken: string | null,
    refreshToken: string | null,
): Promise<{ id: string }[]> {
    try {
        const messagesNeeded = page * pageSize;

        const missingIds = await withGmailApi(
            userId,
            accessToken,
            refreshToken,
            async (gmail: gmail_v1.Gmail) => {
                const response = await gmail.users.messages.list({
                    userId: GMAIL_USER_ID,
                    maxResults: messagesNeeded,
                    pageToken: pageToken || undefined,
                });

                if (!response.data.messages) {
                    return [];
                }

                // Filter out any invalid IDs
                const gmailIds = response.data.messages.map((m) => m.id || "").filter(Boolean);

                // If we have no valid IDs, return early
                if (gmailIds.length === 0) {
                    return [];
                }

                const existingEmails = await prisma.email.findMany({
                    where: {
                        id: { in: gmailIds },
                        userId,
                    },
                    select: { id: true },
                });

                const existingIdSet = new Set(existingEmails.map((e) => e.id));

                return gmailIds.filter((id) => !existingIdSet.has(id)).map((id) => ({ id }));
            },
        );
        return missingIds || [];
    } catch (error) {
        console.error("Error checking for missing emails:", error);
        return [];
    }
}

/**
 * Queue emails for background AI processing
 */
function queueBackgroundAIProcessing(emails: any[]): void {
    if (emails.length === 0) return;

    setTimeout(async () => {
        try {
            const BATCH_SIZE = 5;

            for (let i = 0; i < emails.length; i += BATCH_SIZE) {
                const batch = emails.slice(i, i + BATCH_SIZE);

                for (const email of batch) {
                    try {
                        await enhanceEmail(email);
                        // Add small delay between emails to avoid overwhelming the AI API
                        await new Promise((resolve) => setTimeout(resolve, 100));
                    } catch (error) {
                        console.error("Failed to enhance email:", error);
                        // Continue with next email
                    }
                }

                // Add delay between batches
                await new Promise((resolve) => setTimeout(resolve, 200));
            }
        } catch (error) {
            console.error("Background AI processing error:", error);
            // Silent error in background processing
        }
    }, 100);
}

/**
 * Encrypt email fields for database storage
 */
function encryptEmailFields(emailData: any) {
    // Encrypt body
    const {
        encryptedData: encryptedBodyData,
        iv: bodyIv,
        authTag: bodyAuthTag,
    } = encryptText(emailData.body);
    const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);

    // Encrypt subject
    const {
        encryptedData: encryptedSubjectData,
        iv: subjectIv,
        authTag: subjectAuthTag,
    } = encryptText(emailData.subject);
    const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);

    // Encrypt snippet if it exists
    let encryptedSnippet = null;
    if (emailData.snippet) {
        const {
            encryptedData: encryptedSnippetData,
            iv: snippetIv,
            authTag: snippetAuthTag,
        } = encryptText(emailData.snippet);
        encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);
    }

    return {
        ...emailData,
        body: encryptedBody,
        subject: encryptedSubject,
        snippet: encryptedSnippet,
    };
}

/**
 * Process emails for vector storage
 */
async function processEmailsForVectorStorage(emails: any[]): Promise<void> {
    try {
        const VECTOR_BATCH_SIZE = 5;

        for (let i = 0; i < emails.length; i += VECTOR_BATCH_SIZE) {
            const batch = emails.slice(i, i + VECTOR_BATCH_SIZE);

            for (const email of batch) {
                try {
                    await enhanceEmail(email);
                    await new Promise((resolve) => setTimeout(resolve, 50));
                } catch (error) {
                    // Skip this email
                }
            }

            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    } catch (error) {
        // Silent error
    }
}

/**
 * Store a batch of emails in the database with encryption
 */
async function storeEmailBatch(emails: any[]): Promise<void> {
    if (emails.length === 0) return;

    try {
        // Since we're now encrypting before calling this function, use the emails directly
        const BATCH_SIZE = 50;
        for (let i = 0; i < emails.length; i += BATCH_SIZE) {
            const batch = emails.slice(i, i + BATCH_SIZE);
            await prisma.email.createMany({
                data: batch,
                skipDuplicates: true,
            });
        }
    } catch (error) {
        // Continue execution as we've already fetched the emails
    }
}

/**
 * Fetch missing emails from Gmail
 */
export async function fetchMissingEmails(
    missingIds: string[],
    userId: string,
    accessToken: string | null,
    refreshToken: string | null,
    accountUserId = userId,
): Promise<any[]> {
    if (missingIds.length === 0) {
        return [];
    }

    try {
        // Get thread info for these messages
        const messageDetails = await prisma.message.findMany({
            where: { id: { in: missingIds } },
            select: { id: true, threadId: true, createdAt: true },
        });

        const messageDetailsMap = new Map(messageDetails.map((message) => [message.id, message]));
        const fetchedEmails: any[] = [];

        // Process in batches to avoid overloading Gmail API
        for (let i = 0; i < missingIds.length; i += FETCH_BATCH_SIZE) {
            const batch = missingIds.slice(i, i + FETCH_BATCH_SIZE);

            try {
                const messageBatchPromises = batch.map(async (messageId) => {
                    const message = messageDetailsMap.get(messageId);
                    if (!message) return null;

                    const fullMessage = await withGmailApi(
                        accountUserId,
                        accessToken,
                        refreshToken,
                        async (gmail) => {
                            return gmail.users.messages.get({
                                userId: GMAIL_USER_ID,
                                id: messageId,
                                format: "full",
                            });
                        },
                    );

                    if (!fullMessage?.data) return null;

                    const headers = fullMessage.data.payload?.headers || [];
                    const { subject, from, to } = extractEmailHeaders(headers);

                    const content = fullMessage.data.payload
                        ? extractContentFromParts(fullMessage.data.payload)
                        : { text: "", html: "" };

                    return {
                        id: messageId,
                        threadId: message.threadId,
                        userId,
                        subject,
                        from,
                        to,
                        snippet: fullMessage.data.snippet || "",
                        body:
                            content.html ||
                            content.text ||
                            fullMessage.data.snippet ||
                            "No content available",
                        isRead: !fullMessage.data.labelIds?.includes("UNREAD"),
                        isStarred: fullMessage.data.labelIds?.includes("STARRED") || false,
                        labels: fullMessage.data.labelIds || [],
                        internalDate: fullMessage.data.internalDate || null,
                        createdAt: message.createdAt,
                    };
                });

                const batchResults = (await Promise.all(messageBatchPromises)).filter(
                    Boolean,
                ) as any[];

                // Encrypt emails for database storage
                const encryptedEmails = batchResults.map((email) => encryptEmailFields(email));
                fetchedEmails.push(...encryptedEmails);

                if (batchResults.length > 0) {
                    await storeEmailBatch(encryptedEmails);
                }

                setTimeout(() => {
                    processEmailsForVectorStorage(batchResults).catch(() => {
                        // Silently catch errors in background processing
                    });
                }, 100);
            } catch (error) {
                console.error(`Error fetching batch ${i}-${i + FETCH_BATCH_SIZE}:`, error);
                // Continue with next batch
            }
        }

        return fetchedEmails;
    } catch (error) {
        console.error("Error fetching missing emails:", error);
        return [];
    }
}
