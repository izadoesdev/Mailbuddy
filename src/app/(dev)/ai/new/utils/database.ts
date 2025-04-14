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
        // Ensure keywords is always an array of strings
        const processedKeywords = Array.isArray(keywords)
            ? keywords.map((k) => {
                  // If keyword is an object with task property, convert to string
                  if (typeof k === "object" && k !== null && "task" in k) {
                      const deadline = k.deadline ? ` (Due: ${k.deadline})` : "";
                      return `${k.task}${deadline}`;
                  }
                  // Otherwise convert to string directly
                  return String(k);
              })
            : [];

        // Process deadlines and importantDates
        const processedDeadlines = deadlines || {};
        const processedImportantDates = Array.isArray(importantDates) ? importantDates : [];
        
        // Determine if the email has deadlines
        const hasDeadline = (
            processedImportantDates.length > 0 || 
            Object.keys(processedDeadlines).length > 0 ||
            processedKeywords.some(k => 
                k.toLowerCase().includes("deadline") || 
                k.toLowerCase().includes("due") ||
                k.toLowerCase().includes("by ")
            )
        );
        
        // Try to extract the next deadline date if possible
        let nextDeadline: Date | null = null;
        
        // First try from structured deadlines
        if (Object.keys(processedDeadlines).length > 0) {
            // Find the earliest deadline date in the structured data
            const deadlineDates = Object.values(processedDeadlines)
                .filter((d): d is { date: string } => {
                    return Boolean(d && typeof d === 'object' && 'date' in d);
                })
                .map(d => new Date(d.date))
                .filter(d => !Number.isNaN(d.getTime()));
            
            if (deadlineDates.length > 0) {
                nextDeadline = new Date(Math.min(...deadlineDates.map(d => d.getTime())));
            }
        }
        
        // If no structured deadline, try to parse from importantDates
        if (!nextDeadline && processedImportantDates.length > 0) {
            const dateRegex = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2}|[A-Z][a-z]{2,8} \d{1,2}(?:st|nd|rd|th)?, \d{4}|[A-Z][a-z]{2,8} \d{1,2}(?:st|nd|rd|th)?|\d{1,2}(?:st|nd|rd|th)? [A-Z][a-z]{2,8})/;
            
            for (const dateStr of processedImportantDates) {
                const match = dateStr.match(dateRegex);
                if (match) {
                    const extractedDate = new Date(match[0]);
                    if (!Number.isNaN(extractedDate.getTime())) {
                        if (!nextDeadline || extractedDate < nextDeadline) {
                            nextDeadline = extractedDate;
                        }
                    }
                }
            }
        }

        // Use upsert to handle both insert and update cases
        const result = await prisma.emailAIMetadata.upsert({
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
                deadlines: processedDeadlines,
                importantDates: processedImportantDates,
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
                deadlines: processedDeadlines,
                importantDates: processedImportantDates,
                hasDeadline,
                nextDeadline,
                processingTime,
                modelUsed,
                tokensUsed,
            },
        });

        return { success: true, data: result };
    } catch (error) {
        console.error("Error saving email AI metadata:", error);
        return { success: false, error: String(error) };
    }
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
        const metadata = await prisma.emailAIMetadata.findMany({
            where: {
                emailId: {
                    in: emailIds,
                },
            },
        });

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
                ...(upcoming ? { 
                    nextDeadline: { 
                        gte: now 
                    } 
                } : {})
            },
            orderBy: {
                nextDeadline: 'asc'
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
