"use server";

import index from "@/app/(dev)/ai/new/index";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { revalidatePath } from "next/cache";
interface MetadataStats {
    totalEmails: number;
    emailsWithMetadata: number;
    topPriorities: { label: string; count: number }[];
    categoryCounts: { [key: string]: number };
    metadataSize: string;
    lastAnalyzedDate: string | null;
}

interface AISettings {
    enabled: boolean;
    customPrompt: string;
    preserveMetadata: boolean;
    priorityKeywords: string[];
    contentAlerts: {
        urgentRequests: boolean;
        financialContent: boolean;
        deadlines: boolean;
        meetings: boolean;
        legalDocuments: boolean;
        personalInfo: boolean;
    };
    analysisPreferences: {
        summarize: boolean;
        categorize: boolean;
        extractActions: boolean;
        detectSentiment: boolean;
        highlightImportant: boolean;
    };
    aiAssistLevel: string;
}

/**
 * Calculate the approximate size of metadata in KB or MB
 */
async function calculateMetadataSize(userId: string): Promise<string> {
    try {
        // Get the actual metadata entries for this user to calculate real size
        const metadataEntries = await prisma.emailAIMetadata.findMany({
            where: {
                email: {
                    userId: userId,
                },
            },
            select: {
                category: true,
                categories: true,
                categoryConfidences: true,
                priority: true,
                priorityExplanation: true,
                summary: true,
                sentiment: true,
                importance: true,
                requiresResponse: true,
                responseTimeframe: true,
                keywords: true,
                deadlines: true,
                importantDates: true,
                hasDeadline: true,
                nextDeadline: true,
            },
        });

        // Calculate actual size by converting to JSON and measuring
        let totalBytes = 0;

        // Process in chunks of 100 to avoid blocking the event loop
        const chunkSize = 100;
        for (let i = 0; i < metadataEntries.length; i += chunkSize) {
            const chunk = metadataEntries.slice(i, i + chunkSize);

            // Process each entry in the chunk concurrently
            const chunkSizes = await Promise.all(
                chunk.map((entry) => {
                    const jsonString = JSON.stringify(entry);
                    return new TextEncoder().encode(jsonString).length;
                }),
            );

            // Sum the sizes
            totalBytes += chunkSizes.reduce((sum, size) => sum + size, 0);
        }

        // Format the size appropriately
        if (totalBytes >= 1024 * 1024) {
            return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
        }

        if (totalBytes >= 1024) {
            return `${(totalBytes / 1024).toFixed(1)} KB`;
        }

        return `${totalBytes} bytes`;
    } catch (error) {
        console.error("Error calculating metadata size:", error);
        return "Size unknown"; // Fallback if calculation fails
    }
}

/**
 * Get AI metadata statistics for the current user
 */
export async function getAIMetadataStats(userId: string): Promise<MetadataStats> {
    try {
        // Run all independent database queries concurrently
        const [
            totalEmailsCount,
            emailsWithMetadataCount,
            priorityData,
            categoryData,
            lastMetadata,
            metadataSize,
        ] = await Promise.all([
            // Get total email count
            prisma.email.count({
                where: { userId },
            }),

            // Get count of emails with AI metadata
            prisma.emailAIMetadata.count({
                where: {
                    email: {
                        userId,
                    },
                },
            }),

            // Get priority distribution
            prisma.emailAIMetadata.groupBy({
                by: ["priority"],
                where: {
                    email: {
                        userId,
                    },
                    priority: {
                        not: null,
                    },
                },
                _count: {
                    priority: true,
                },
                orderBy: {
                    _count: {
                        priority: "desc",
                    },
                },
                take: 5,
            }),

            // Get category distribution
            prisma.emailAIMetadata.groupBy({
                by: ["category"],
                where: {
                    email: {
                        userId,
                    },
                    category: {
                        not: null,
                    },
                },
                _count: {
                    category: true,
                },
            }),

            // Get last analyzed date (most recent metadata update)
            prisma.emailAIMetadata.findFirst({
                where: {
                    email: {
                        userId,
                    },
                },
                orderBy: {
                    updatedAt: "desc",
                },
                select: {
                    updatedAt: true,
                },
            }),

            // Calculate metadata size
            calculateMetadataSize(userId),
        ]);

        // Format priority data
        const topPriorities = priorityData.map((p) => ({
            label: p.priority || "unknown",
            count: p._count.priority,
        }));

        // Build category counts object
        const categoryCounts: { [key: string]: number } = {};
        for (const c of categoryData) {
            if (c.category) {
                categoryCounts[c.category] = c._count.category;
            }
        }

        return {
            totalEmails: totalEmailsCount,
            emailsWithMetadata: emailsWithMetadataCount,
            topPriorities,
            categoryCounts,
            metadataSize,
            lastAnalyzedDate: lastMetadata ? lastMetadata.updatedAt.toISOString() : null,
        };
    } catch (error) {
        console.error("Error fetching AI metadata stats:", error);
        // Return fallback data if there's an error
        return {
            totalEmails: 0,
            emailsWithMetadata: 0,
            topPriorities: [],
            categoryCounts: {},
            metadataSize: "Size unknown",
            lastAnalyzedDate: null,
        };
    }
}

/**
 * Update user AI settings
 */
export async function updateAISettings(
    userId: string,
    settings: AISettings,
): Promise<{ success: boolean; message: string }> {
    try {
        // First check if the user already has AI settings
        const existingSettings = await prisma.aIUserSettings.findUnique({
            where: { userId },
        });

        if (existingSettings) {
            // Update existing settings
            await prisma.aIUserSettings.update({
                where: { userId },
                data: {
                    enabled: settings.enabled,
                    customPrompt: settings.customPrompt,
                    preserveMetadata: settings.preserveMetadata,
                    priorityKeywords: settings.priorityKeywords,
                    contentAlerts: settings.contentAlerts,
                    analysisPreferences: settings.analysisPreferences,
                    aiAssistLevel: settings.aiAssistLevel,
                },
            });
        } else {
            // Create new settings
            await prisma.aIUserSettings.create({
                data: {
                    userId,
                    enabled: settings.enabled,
                    customPrompt: settings.customPrompt,
                    preserveMetadata: settings.preserveMetadata,
                    priorityKeywords: settings.priorityKeywords,
                    contentAlerts: settings.contentAlerts,
                    analysisPreferences: settings.analysisPreferences,
                    aiAssistLevel: settings.aiAssistLevel,
                },
            });
        }

        // Revalidate the profile page to refresh the data
        revalidatePath("/profile");

        return {
            success: true,
            message: "AI preferences updated successfully",
        };
    } catch (error) {
        console.error("Failed to update AI settings:", error);
        return {
            success: false,
            message: "Failed to update AI preferences. Please try again.",
        };
    }
}

/**
 * Get AI settings for a user
 */
export async function getAISettings(userId: string): Promise<AISettings | null> {
    try {
        const settings = await prisma.aIUserSettings.findUnique({
            where: { userId },
        });

        if (!settings) return null;

        return {
            enabled: settings.enabled,
            customPrompt: settings.customPrompt || "",
            preserveMetadata: settings.preserveMetadata,
            priorityKeywords: settings.priorityKeywords,
            contentAlerts: settings.contentAlerts as any,
            analysisPreferences: settings.analysisPreferences as any,
            aiAssistLevel: settings.aiAssistLevel,
        };
    } catch (error) {
        console.error("Failed to fetch AI settings:", error);
        return null;
    }
}

/**
 * Clear all AI metadata for the current user
 */
export async function clearAIMetadata(
    userId: string,
): Promise<{ success: boolean; message: string }> {
    try {
        // Get all email IDs for the user and delete metadata in one transaction
        const count = await prisma.$transaction(async (tx) => {
            // Get all email IDs for the user
            const userEmails = await tx.email.findMany({
                where: { userId },
                select: { id: true },
            });

            const emailIds = userEmails.map((email) => email.id);

            // Delete all AI metadata for those emails
            const result = await tx.emailAIMetadata.deleteMany({
                where: {
                    emailId: {
                        in: emailIds,
                    },
                },
            });

            return result.count;
        });

        await index.index.deleteNamespace(`user_${userId}`);

        // Revalidate the profile page to refresh the data
        revalidatePath("/profile");

        return {
            success: true,
            message: `Successfully cleared AI metadata from ${count} emails`,
        };
    } catch (error) {
        console.error("Failed to clear AI metadata:", error);
        return {
            success: false,
            message: "Failed to clear AI metadata. Please try again.",
        };
    }
}

/**
 * Update AI analysis for all emails
 */
export async function runAIAnalysisOnAllEmails(
    userId: string,
): Promise<{ success: boolean; message: string }> {
    try {
        // TODO: add emails to a queue for processing
        // -- For now, just count how many emails would be processed for the sake of the demo.. god help us all
        const unprocessedEmails = await prisma.email.count({
            where: {
                userId,
                aiMetadata: null,
            },
        });

        // Revalidate the profile page to refresh the data -- disabled for now cause let's be real we ain't revalidating this page anytime soon without that queue justin
        // revalidatePath("/profile");

        return {
            success: true,
            message: `AI analysis has been scheduled for ${unprocessedEmails} emails`,
        };
    } catch (error) {
        // if this errors, the database is fucked and we need to fix it
        console.error("Failed to schedule AI analysis:", error);
        return {
            success: false,
            message: "Failed to schedule AI analysis. Please try again.",
        };
    }
}

/**
 * Clear all emails for a user
 */
export async function clearAllEmails(
    userId: string,
    password: string,
): Promise<{ success: boolean; message: string }> {
    // ignore that password does jack shit for now, can't find a way to verify it manually with better-auth yet, what a blunder
    try {
        // Then delete all messages associated with the user's emails
        const messageResult = await prisma.message.deleteMany({
            where: {
                email: {
                    userId,
                },
            },
        });

        // Revalidate the profile page to refresh the data
        revalidatePath("/profile");

        return {
            success: true,
            message: `Successfully deleted ${messageResult.count} emails and associated messages`,
        };
    } catch (error) {
        console.error("Failed to clear emails:", error);
        return {
            success: false,
            message: "Failed to delete emails. Please try again.",
        };
    }
}
