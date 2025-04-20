"use server";

import { prisma } from "@/libs/db";

/**
 * Save email AI metadata to the database
 */
export async function saveEmailAIMetadata({
    emailId,
    category,
    priority,
    priorityExplanation,
    summary,
    sentiment,
    importance,
    requiresResponse,
    responseTimeframe,
    keywords,
    deadlines,
    importantDates,
    processingTime,
    modelUsed,
    tokensUsed,
    categories = [],
    categoryConfidences = {},
}: {
    emailId: string;
    category?: string;
    categories?: string[];
    categoryConfidences?: any;
    priority?: string;
    priorityExplanation?: string;
    summary?: string;
    sentiment?: string;
    importance?: string;
    requiresResponse?: boolean;
    responseTimeframe?: string;
    keywords?: string[] | any[];
    deadlines?: any; // Structured deadline information
    importantDates?: string[]; // Array of important dates
    processingTime?: number;
    modelUsed?: string;
    tokensUsed?: number;
}) {
    try {
        // Process keywords, deadlines, and important dates concurrently
        const [processedKeywords, hasDeadline, nextDeadline] = await Promise.all([
            // Process keywords
            processKeywords(keywords),

            // Determine if the email has deadlines (needs both deadlines and keywords)
            determineHasDeadline(keywords, deadlines, importantDates),

            // Extract the next deadline date
            extractNextDeadline(deadlines, importantDates),
        ]);

        // Use prisma transaction to ensure data consistency
        const result = await prisma.$transaction(async (tx) => {
            return await tx.emailAIMetadata.upsert({
                where: {
                    emailId: emailId,
                },
                update: {
                    category,
                    categories,
                    categoryConfidences,
                    priority,
                    priorityExplanation,
                    summary,
                    sentiment,
                    importance,
                    requiresResponse,
                    responseTimeframe,
                    keywords: processedKeywords,
                    deadlines: deadlines || {},
                    importantDates: Array.isArray(importantDates) ? importantDates : [],
                    hasDeadline,
                    nextDeadline,
                    processingTime,
                    modelUsed,
                    tokensUsed,
                },
                create: {
                    emailId,
                    category,
                    categories,
                    categoryConfidences,
                    priority,
                    priorityExplanation,
                    summary,
                    sentiment,
                    importance,
                    requiresResponse,
                    responseTimeframe,
                    keywords: processedKeywords,
                    deadlines: deadlines || {},
                    importantDates: Array.isArray(importantDates) ? importantDates : [],
                    hasDeadline,
                    nextDeadline,
                    processingTime,
                    modelUsed,
                    tokensUsed,
                },
            });
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Error saving email AI metadata:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Process keywords into standardized format
 */
async function processKeywords(keywords?: string[] | any[]): Promise<string[]> {
    if (!Array.isArray(keywords)) return [];

    // Generic labels to filter out
    const genericLabels = ["URGENT", "DEADLINE", "MEETING", "FINANCIAL", "PERSONAL", "LEGAL"];

    // Process in parallel with Promise.all
    const processedItems = await Promise.all(
        keywords.map(async (k) => {
            // If keyword is an object with task property, convert to string
            if (typeof k === "object" && k !== null && "task" in k) {
                const deadline = k.deadline ? ` (Due: ${k.deadline})` : "";
                return `${k.task}${deadline}`;
            }
            // Otherwise convert to string directly
            return String(k);
        }),
    );

    // Filter out generic keywords
    return processedItems.filter((keyword) => {
        // Only keep keywords that:
        // 1. Aren't just a generic label
        // 2. Start with a verb (typical for action items)
        // 3. Or contain detailed information
        return (
            !genericLabels.includes(keyword) &&
            (keyword.length > 10 || /^[A-Z][a-z]+\s/.test(keyword))
        );
    });
}

/**
 * Determine if email has deadlines
 */
async function determineHasDeadline(
    keywords?: string[] | any[],
    deadlines?: any,
    importantDates?: string[],
): Promise<boolean> {
    const processedImportantDates = Array.isArray(importantDates) ? importantDates : [];
    const processedDeadlines = deadlines || {};

    // Check if there are deadlines in the structured data
    if (processedImportantDates.length > 0 || Object.keys(processedDeadlines).length > 0) {
        return true;
    }

    // Check keywords for deadline-related terms
    if (Array.isArray(keywords)) {
        const keywordStrings = keywords.map((k) => {
            if (typeof k === "object" && k !== null && "task" in k) {
                return k.task;
            }
            return String(k);
        });

        return keywordStrings.some(
            (k) =>
                k.toLowerCase().includes("deadline") ||
                k.toLowerCase().includes("due") ||
                k.toLowerCase().includes("by "),
        );
    }

    return false;
}

/**
 * Extract the next deadline date from metadata
 */
async function extractNextDeadline(
    deadlines?: any,
    importantDates?: string[],
): Promise<Date | null> {
    let nextDeadline: Date | null = null;
    const processedDeadlines = deadlines || {};
    const processedImportantDates = Array.isArray(importantDates) ? importantDates : [];

    // First try from structured deadlines
    if (Object.keys(processedDeadlines).length > 0) {
        // Find the earliest deadline date in the structured data
        const deadlineDates = Object.values(processedDeadlines)
            .filter((d): d is { date: string } => {
                return Boolean(d && typeof d === "object" && "date" in d);
            })
            .map((d) => new Date(d.date))
            .filter((d) => !Number.isNaN(d.getTime()));

        if (deadlineDates.length > 0) {
            nextDeadline = new Date(Math.min(...deadlineDates.map((d) => d.getTime())));
        }
    }

    // If no structured deadline, try to parse from importantDates
    if (!nextDeadline && processedImportantDates.length > 0) {
        const dateRegex =
            /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|[A-Z][a-z]{2,8} \d{1,2}(?:st|nd|rd|th)?, \d{4}|[A-Z][a-z]{2,8} \d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)? [A-Z][a-z]{2,8})/;

        // Process all dates in parallel
        const extractedDates = await Promise.all(
            processedImportantDates.map(async (dateStr) => {
                const match = dateStr.match(dateRegex);
                if (match) {
                    const extractedDate = new Date(match[0]);
                    if (!Number.isNaN(extractedDate.getTime())) {
                        return extractedDate;
                    }
                }
                return null;
            }),
        );

        // Filter out nulls and find the earliest date
        const validDates = extractedDates.filter((d): d is Date => d !== null);
        if (validDates.length > 0) {
            nextDeadline = new Date(Math.min(...validDates.map((d) => d.getTime())));
        }
    }

    return nextDeadline;
}

/**
 * Get email AI metadata from the database
 */
export async function getEmailAIMetadata(emailId: string) {
    try {
        const metadata = await prisma.emailAIMetadata.findUnique({
            where: {
                emailId: emailId,
            },
        });

        return { success: true, metadata };
    } catch (error) {
        console.error("Error getting email AI metadata:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Get multiple email AI metadata records from the database
 */
export async function getMultipleEmailAIMetadata(emailIds: string[]) {
    try {
        // Split into chunks to avoid query limits
        const chunkSize = 100;
        const chunks = [];

        for (let i = 0; i < emailIds.length; i += chunkSize) {
            chunks.push(emailIds.slice(i, i + chunkSize));
        }

        // Query all chunks in parallel
        const chunkResults = await Promise.all(
            chunks.map((chunk) =>
                prisma.emailAIMetadata.findMany({
                    where: {
                        emailId: {
                            in: chunk,
                        },
                    },
                }),
            ),
        );

        // Combine results
        const metadata = chunkResults.flat();

        return { success: true, metadata };
    } catch (error) {
        console.error("Error getting multiple email AI metadata:", error);
        return { success: false, error: String(error), metadata: [] };
    }
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(category: string, limit = 10) {
    try {
        const metadata = await prisma.emailAIMetadata.findMany({
            where: {
                category,
            },
            include: {
                email: true,
            },
            take: limit,
        });

        return { success: true, emails: metadata.map((m) => m.email) };
    } catch (error) {
        console.error("Error getting emails by category:", error);
        return { success: false, error: String(error), emails: [] };
    }
}

/**
 * Get emails by priority
 */
export async function getEmailsByPriority(priority: string, limit = 10) {
    try {
        const metadata = await prisma.emailAIMetadata.findMany({
            where: {
                priority,
            },
            include: {
                email: true,
            },
            take: limit,
        });

        return { success: true, emails: metadata.map((m) => m.email) };
    } catch (error) {
        console.error("Error getting emails by priority:", error);
        return { success: false, error: String(error), emails: [] };
    }
}

/**
 * Get emails with deadlines
 */
export async function getEmailsWithDeadlines(limit = 10, upcoming = true) {
    try {
        const now = new Date();
        const metadata = await prisma.emailAIMetadata.findMany({
            where: {
                hasDeadline: true,
                ...(upcoming
                    ? {
                          nextDeadline: {
                              gte: now,
                          },
                      }
                    : {}),
            },
            orderBy: {
                nextDeadline: "asc",
            },
            include: {
                email: true,
            },
            take: limit,
        });

        return { success: true, emails: metadata.map((m) => m.email) };
    } catch (error) {
        console.error("Error getting emails with deadlines:", error);
        return { success: false, error: String(error), emails: [] };
    }
}
