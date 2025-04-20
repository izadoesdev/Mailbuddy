/**
 * Main AI module that exports all AI functionality
 *
 * This file serves as a central export point for all AI capabilities,
 * making it easier to import and use the AI features.
 */

import { prisma } from "@/libs/db";
import { getEmailAIMetadata, saveEmailAIMetadata } from "./utils/database";
// Import required functions for local use
import { processEmail as processEmailOpenRouter } from "./utils/openrouter";
import { storeEmail } from "./utils/vectors";

// Vector operations
export {
    storeEmail,
    storeVector,
    queryVector,
    deleteVectors,
    batchStoreVectors,
    listNamespaces,
    deleteUserNamespace,
} from "./utils/vectors";

// Search operations
export { searchSimilarEmails, searchEmailsByQuery } from "./utils/search";

// Text analysis operations
// export { categorizeEmail } from "./utils/categorize";

// Email content processing
export { cleanEmail, cleanMetadata } from "./utils/clean";

// Groq LLM functions
// export {
//     categorizeEmail as groqCategorizeEmail,
//     prioritizeEmail,
//     summarizeEmail,
//     extractActionItems,
//     extractContactInfo,
//     processEmail,
// } from "./utils/groq";

// Batch processing
export { storeBatchEmails } from "./utils/batch";

// Database operations
export {
    saveEmailAIMetadata,
    getEmailAIMetadata,
    getMultipleEmailAIMetadata,
    getEmailsByCategory,
    getEmailsByPriority,
} from "./utils/database";

// Constants
export {
    EMAIL_CATEGORIES,
    PRIORITY_LEVELS,
    EMAIL_CLEANING,
    VECTOR_CONFIG,
    AI_PROMPTS,
    BATCH_SIZES,
} from "./constants";

// Define the interface for user settings
interface AIUserSettings {
    userId: string;
    enabled: boolean;
    preserveMetadata?: boolean;
    priorityKeywords?: string[];
    contentAlerts?: {
        urgentRequests: boolean;
        financialContent: boolean;
        deadlines: boolean;
        meetings: boolean;
        legalDocuments: boolean;
        personalInfo: boolean;
    };
    analysisPreferences?: {
        summarize: boolean;
        categorize: boolean;
        extractActions: boolean;
        detectSentiment: boolean;
        highlightImportant: boolean;
    };
}

// Define the interface for AI data
interface AIData {
    category?: string;
    priority?: string;
    summary?: string;
    priorityExplanation?: string;
    actionItems?: string[];
    importantDates?: string[];
    deadlines?: Record<
        string,
        {
            event: string;
            date: string;
            description?: string;
        }
    >;
    contactInfo?: Record<string, string>;
    [key: string]: any;
}

// Define the interface for email metadata
interface EmailMetadata {
    emailId: string;
    category?: string;
    priority?: string;
    summary?: string;
    processingTime?: number;
    modelUsed?: string;
    priorityExplanation?: string;
    keywords?: string[];
    deadlines?: Record<
        string,
        {
            event: string;
            date: string;
            description?: string;
        }
    >;
    importantDates?: string[];
}

/**
 * Process an email with AI to extract useful information
 *
 * This is a convenience function that combines multiple AI operations
 * into a single call for simpler usage.
 */
export async function enhanceEmail(email: any) {
    if (!email || !email.id || !email.userId) {
        throw new Error("Invalid email data");
    }

    try {
        // First check if we already have metadata for this email
        const existingMetadata = await getEmailAIMetadata(email.id);

        if (existingMetadata.success && existingMetadata.metadata) {
            return {
                success: true,
                data: {
                    ...email,
                    aiMetadata: existingMetadata.metadata,
                },
                fromCache: true,
            };
        }

        // Get user's AI settings
        const userSettings = (await prisma.aIUserSettings.findUnique({
            where: { userId: email.userId },
        })) as AIUserSettings | null;

        // If AI is disabled for this user, return with no metadata
        if (userSettings && !userSettings.enabled) {
            console.log(`AI analysis disabled for user ${email.userId}, skipping analysis`);
            return {
                success: true,
                data: {
                    ...email,
                    aiMetadata: null,
                },
                fromCache: false,
            };
        }

        // Process the email with OpenRouter to extract all AI metadata at once
        // Pass the user settings as context to improve processing
        const aiData = (await processEmailOpenRouter(email, userSettings)) as AIData;

        // Check if we got valid AI data - don't proceed if invalid
        if (!aiData || !aiData.summary || aiData.summary === "Error processing email") {
            console.error(`Failed to generate valid AI metadata for email ${email.id}`);
            return {
                success: false,
                error: "Failed to generate valid AI metadata",
                data: null,
            };
        }

        // If user has preserveMetadata disabled, don't store in vector DB
        if (!userSettings || userSettings.preserveMetadata) {
            // Store the email in the vector database for future searches
            await storeEmail(email);
        }

        // Save the AI analysis results to the database
        const startTime = Date.now();

        // Determine priority based on user settings
        // Check if any priority keywords match the email content
        let calculatedPriority = aiData.priority || "Medium";
        if (userSettings?.priorityKeywords && userSettings.priorityKeywords.length > 0) {
            const emailContent = [email.subject || "", email.snippet || "", email.body || ""]
                .join(" ")
                .toLowerCase();

            for (const keyword of userSettings.priorityKeywords) {
                if (emailContent.includes(keyword.toLowerCase())) {
                    calculatedPriority = "High";
                    break;
                }
            }
        }

        // Create structured deadline information from importantDates
        const deadlineData: Record<string, { event: string; date: string; description?: string }> =
            {};

        // Process importantDates if available
        if (aiData.importantDates && Array.isArray(aiData.importantDates)) {
            aiData.importantDates.forEach((dateItem, index) => {
                // Format could be "Event Name: Date/Time" or just a date string
                const parts = typeof dateItem === "string" ? dateItem.split(":") : [];

                if (parts.length > 1) {
                    const event = parts[0].trim();
                    const dateTime = parts.slice(1).join(":").trim();

                    // Skip generic event names like "Event" or "Date"
                    if (event && !["event", "date", "deadline"].includes(event.toLowerCase())) {
                        deadlineData[`deadline_${index}`] = {
                            event,
                            date: dateTime,
                            description: dateItem,
                        };
                    }
                } else if (typeof dateItem === "string") {
                    // Just a date without an event description - try to extract a meaningful name
                    // This is a fallback, the new prompt should provide better structured data
                    const lowerDateItem = dateItem.toLowerCase();
                    let eventName = "Deadline";

                    // Try to infer event type from the date string
                    if (lowerDateItem.includes("meet") || lowerDateItem.includes("call")) {
                        eventName = "Meeting";
                    } else if (
                        lowerDateItem.includes("due") ||
                        lowerDateItem.includes("deadline")
                    ) {
                        eventName = "Project Deadline";
                    } else if (
                        lowerDateItem.includes("submit") ||
                        lowerDateItem.includes("deliver")
                    ) {
                        eventName = "Submission";
                    }

                    deadlineData[`deadline_${index}`] = {
                        event: eventName,
                        date: dateItem,
                        description: dateItem,
                    };
                }
            });
        }

        // Also process structured deadlines already provided by the AI
        if (aiData.deadlines && typeof aiData.deadlines === "object") {
            for (const [key, value] of Object.entries(aiData.deadlines)) {
                if (value && typeof value === "object" && "date" in value && "event" in value) {
                    // The AI model already provided properly structured deadline data
                    // Just make sure we don't accept generic event names
                    const eventName = value.event;
                    if (
                        eventName &&
                        typeof eventName === "string" &&
                        !["event", "date", "deadline"].includes(eventName.toLowerCase())
                    ) {
                        deadlineData[key] = value;
                    }
                }
            }
        }

        const dbMetadata: EmailMetadata = {
            emailId: email.id,
            category: userSettings?.analysisPreferences?.categorize
                ? aiData.category || "Uncategorized"
                : undefined,
            priority: calculatedPriority,
            summary: userSettings?.analysisPreferences?.summarize
                ? aiData.summary || "No summary available"
                : undefined,
            processingTime: Date.now() - startTime,
            modelUsed: "groq",
            priorityExplanation: aiData.priorityExplanation || "",
            keywords: [],
            deadlines: deadlineData,
            importantDates: Array.isArray(aiData.importantDates)
                ? aiData.importantDates.map(String)
                : [],
        };

        // Add priorityExplanation if available
        if ("priorityExplanation" in aiData && typeof aiData.priorityExplanation === "string") {
            dbMetadata.priorityExplanation = aiData.priorityExplanation;
        }

        // Add action items/keywords if extractActions is enabled
        if (userSettings?.analysisPreferences?.extractActions && "actionItems" in aiData) {
            // Only use action items that are specific and not just generic labels
            dbMetadata.keywords = Array.isArray(aiData.actionItems)
                ? aiData.actionItems.filter((item) => {
                      // Skip generic labels
                      const genericLabels = [
                          "URGENT",
                          "DEADLINE",
                          "MEETING",
                          "FINANCIAL",
                          "PERSONAL",
                          "LEGAL",
                      ];
                      // Ensure it's not just a generic label and starts with a verb or has meaningful content
                      return (
                          item &&
                          typeof item === "string" &&
                          !genericLabels.includes(item) &&
                          (item.length > 10 || /^[A-Z][a-z]+\s/.test(item))
                      );
                  })
                : [];
        } else {
            dbMetadata.keywords = [];
        }

        // Check content alerts if enabled
        if (userSettings?.contentAlerts) {
            // Detect urgency based on content and priority
            const isUrgent = calculatedPriority === "High" || calculatedPriority === "Urgent";

            // Logic for content alerts based on settings
            if (userSettings.contentAlerts.urgentRequests && isUrgent) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "URGENT"];
            }

            // For other alerts, we'd need to analyze the email content
            // Here we're just doing a basic check to demonstrate
            const emailContent = `${email.subject || ""} ${email.body || ""}`.toLowerCase();

            if (
                userSettings.contentAlerts.financialContent &&
                /\$|payment|invoice|receipt|transaction|credit card|bank|money|financial|finance/.test(
                    emailContent,
                )
            ) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "FINANCIAL"];
            }

            if (
                userSettings.contentAlerts.deadlines &&
                /deadline|due date|by tomorrow|by next|due by|due on|expires|expiring/.test(
                    emailContent,
                )
            ) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "DEADLINE"];
            }

            if (
                userSettings.contentAlerts.meetings &&
                /meeting|call|zoom|teams|google meet|conference|webinar|schedule/.test(emailContent)
            ) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "MEETING"];
            }

            if (
                userSettings.contentAlerts.legalDocuments &&
                /legal|contract|agreement|terms|conditions|policy|compliance|law|attorney/.test(
                    emailContent,
                )
            ) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "LEGAL"];
            }

            if (
                userSettings.contentAlerts.personalInfo &&
                /ssn|social security|passport|birth|address|private|confidential|personal/.test(
                    emailContent,
                )
            ) {
                dbMetadata.keywords = [...(dbMetadata.keywords || []), "PERSONAL"];
            }
        }

        // Remove duplicates from keywords
        if (dbMetadata.keywords) {
            dbMetadata.keywords = [...new Set(dbMetadata.keywords)];
        }

        const saveResult = await saveEmailAIMetadata(dbMetadata);

        if (!saveResult.success) {
            console.error(`Failed to save AI metadata for email ${email.id}:`, saveResult.error);
        }

        return {
            success: true,
            data: {
                ...email,
                aiMetadata: saveResult.success ? saveResult.data : null,
            },
            fromCache: false,
        };
    } catch (error) {
        console.error("Error enhancing email:", error);
        throw error;
    }
}
