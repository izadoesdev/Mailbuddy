/**
 * Main AI module that exports all AI functionality
 *
 * This file serves as a central export point for all AI capabilities,
 * making it easier to import and use the AI features.
 */

// Import required functions for local use
import { processEmail } from "./utils/groq";
import { processEmail as processEmailOpenRouter } from "./utils/openrouter";
import { storeEmail } from "./utils/vectors";
import { saveEmailAIMetadata, getEmailAIMetadata } from "./utils/database";

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
export { categorizeEmail } from "./utils/categorize";

// Email content processing
export { cleanEmail, cleanMetadata } from "./utils/clean";

// Groq LLM functions
export {
    categorizeEmail as groqCategorizeEmail,
    prioritizeEmail,
    summarizeEmail,
    extractActionItems,
    extractContactInfo,
    processEmail,
} from "./utils/groq";

// Batch processing
export {
    processBatchEmails,
    storeBatchEmails,
    analyzeBatchEmails,
} from "./utils/batch";

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

/**
 * Process an email with AI to extract useful information
 *
 * This is a convenience function that combines multiple AI operations
 * into a single call for simpler usage.
 */
export async function enhanceEmail(email: any) {
    if (!email || !email.id || !email.userId) {
        return { success: false, error: "Invalid email data" };
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

        // Process the email with OpenRouter to extract all AI metadata at once
        const aiData = await processEmailOpenRouter(email);

        // Check if we got valid AI data - don't proceed if invalid
        if (!aiData || !aiData.summary || aiData.summary === "Error processing email") {
            console.error(`Failed to generate valid AI metadata for email ${email.id}`);
            return { 
                success: false, 
                error: "Failed to generate valid AI metadata",
                data: null 
            };
        }

        // Store the email in the vector database for future searches
        await storeEmail(email);

        // Save the AI analysis results to the database
        const startTime = Date.now();

        // Create metadata object with proper typing
        interface EmailMetadata {
            emailId: string;
            category?: string;
            priority?: string;
            summary?: string;
            processingTime?: number;
            modelUsed?: string;
            priorityExplanation?: string;
            keywords?: string[];
        }

        const dbMetadata: EmailMetadata = {
            emailId: email.id,
            category: aiData.category || "Uncategorized",
            priority: aiData.priority || "Medium",
            summary: aiData.summary || "No summary available",
            processingTime: Date.now() - startTime,
            modelUsed: "groq",
            priorityExplanation: aiData.priorityExplanation || "",
            keywords: Array.isArray(aiData.actionItems) ? aiData.actionItems : [],
        };

        // Add priorityExplanation if available
        if ("priorityExplanation" in aiData && typeof aiData.priorityExplanation === "string") {
            dbMetadata.priorityExplanation = aiData.priorityExplanation;
        }

        // Add action items if available
        if ("actionItems" in aiData && Array.isArray(aiData.actionItems)) {
            dbMetadata.keywords = aiData.actionItems;
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
        return { success: false, error: String(error) };
    }
}
