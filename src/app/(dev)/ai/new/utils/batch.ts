"use server";

import type { Email } from "@/app/(main)/inbox/types";
import { BATCH_SIZES } from "../constants";
// import { processEmail } from "./groq";
import { cleanEmail } from "./clean";
import { saveEmailAIMetadata } from "./database";
import { storeEmail } from "./vectors";

/**
 * Process a batch of emails with AI and store them in the vector database
 */
// export async function processBatchEmails(emails: Email[]) {
//     if (!Array.isArray(emails) || emails.length === 0) {
//         return {
//             success: false,
//             error: "No emails to process",
//             results: [],
//         };
//     }

//     const results: any[] = [];
//     const errors: string[] = [];
//     let processedCount = 0;

//     // Divide into smaller batches for processing
//     const batches: Email[][] = [];
//     for (let i = 0; i < emails.length; i += BATCH_SIZES.EMAIL_PROCESSING) {
//         batches.push(emails.slice(i, i + BATCH_SIZES.EMAIL_PROCESSING));
//     }

//     // Process each batch
//     for (const [batchIndex, batch] of batches.entries()) {
//         console.log(
//             `Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`,
//         );

//         // Process each email in the batch
//         const batchPromises = batch.map(async (email) => {
//             try {
//                 // Skip emails with insufficient content
//                 const content = cleanEmail(email);
//                 if (!content || content.length < 30) {
//                     return {
//                         emailId: email.id,
//                         success: false,
//                         error: "Insufficient content for processing",
//                     };
//                 }

//                 // Get AI metadata
//                 const aiData = await processEmail(email);

//                 // Store in vector database
//                 await storeEmail(email);

//                 // Save to SQL database
//                 interface EmailMetadata {
//                     emailId: string;
//                     category?: string;
//                     priority?: string;
//                     summary?: string;
//                     modelUsed?: string;
//                     priorityExplanation?: string;
//                     keywords?: string[];
//                 }

//                 const dbMetadata: EmailMetadata = {
//                     emailId: email.id,
//                     category: aiData.category || "Uncategorized",
//                     priority: aiData.priority || "Medium",
//                     summary: aiData.summary || "No summary available",
//                     modelUsed: "groq",
//                 };

//                 // Add priorityExplanation if available
//                 if (
//                     "priorityExplanation" in aiData &&
//                     typeof aiData.priorityExplanation === "string"
//                 ) {
//                     dbMetadata.priorityExplanation = aiData.priorityExplanation;
//                 }

//                 // Add action items if available
//                 if ("actionItems" in aiData && Array.isArray(aiData.actionItems)) {
//                     dbMetadata.keywords = aiData.actionItems;
//                 }

//                 await saveEmailAIMetadata(dbMetadata);

//                 processedCount++;

//                 return {
//                     emailId: email.id,
//                     success: true,
//                     aiData,
//                 };
//             } catch (error) {
//                 const errorMessage = `Error processing email ${email.id}: ${String(error)}`;
//                 errors.push(errorMessage);
//                 return {
//                     emailId: email.id,
//                     success: false,
//                     error: errorMessage,
//                 };
//             }
//         });

//         // Process batch with controlled concurrency
//         const batchResults = await Promise.all(batchPromises);
//         results.push(...batchResults);

//         // Brief pause between batches to prevent rate limiting
//         if (batchIndex < batches.length - 1) {
//             await new Promise((resolve) => setTimeout(resolve, 200));
//         }
//     }

//     return {
//         success: processedCount > 0,
//         processedCount,
//         totalCount: emails.length,
//         errors: errors.length > 0 ? errors : undefined,
//         results,
//     };
// }

/**
 * Store a batch of emails in the vector database without AI processing
 */
export async function storeBatchEmails(emails: Email[]) {
    if (!Array.isArray(emails) || emails.length === 0) {
        return {
            success: false,
            error: "No emails to store",
            results: [],
        };
    }

    const results: any[] = [];
    const errors: string[] = [];
    let successCount = 0;

    // Divide into smaller batches for storage
    const batches: Email[][] = [];
    for (let i = 0; i < emails.length; i += BATCH_SIZES.VECTOR_STORAGE) {
        batches.push(emails.slice(i, i + BATCH_SIZES.VECTOR_STORAGE));
    }

    // Process each batch
    for (const [batchIndex, batch] of batches.entries()) {
        console.log(`Storing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

        // Store each email in the batch
        const batchPromises = batch.map(async (email) => {
            try {
                const result = await storeEmail(email);

                if (result.success) {
                    successCount++;
                    return {
                        emailId: email.id,
                        success: true,
                    };
                }

                const errorMessage = `Failed to store email ${email.id}: ${result.error}`;
                errors.push(errorMessage);
                return {
                    emailId: email.id,
                    success: false,
                    error: errorMessage,
                };
            } catch (error) {
                const errorMessage = `Error storing email ${email.id}: ${String(error)}`;
                errors.push(errorMessage);
                return {
                    emailId: email.id,
                    success: false,
                    error: errorMessage,
                };
            }
        });

        // Process batch with controlled concurrency
        const batchResults = await Promise.all(batchPromises);
        results.push(...batchResults);

        // Brief pause between batches to prevent rate limiting
        if (batchIndex < batches.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 100));
        }
    }

    return {
        success: successCount > 0,
        successCount,
        totalCount: emails.length,
        errors: errors.length > 0 ? errors : undefined,
        results,
    };
}

/**
 * Enrich a batch of emails with AI metadata without storing them
 */
// export async function analyzeBatchEmails(emails: Email[]) {
//     if (!Array.isArray(emails) || emails.length === 0) {
//         return {
//             success: false,
//             error: "No emails to analyze",
//             results: [],
//         };
//     }

//     const results: any[] = [];
//     const errors: string[] = [];
//     let analyzedCount = 0;

//     // Divide into smaller batches for analysis
//     const batches: Email[][] = [];
//     for (let i = 0; i < emails.length; i += BATCH_SIZES.EMAIL_PROCESSING) {
//         batches.push(emails.slice(i, i + BATCH_SIZES.EMAIL_PROCESSING));
//     }

//     // Process each batch
//     for (const [batchIndex, batch] of batches.entries()) {
//         console.log(`Analyzing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);

//         // Analyze each email in the batch
//         const batchPromises = batch.map(async (email) => {
//             try {
//                 // const aiData = await processEmail(email);
//                 analyzedCount++;

//                 return {
//                     emailId: email.id,
//                     success: true,
//                     aiData,
//                 };
//             } catch (error) {
//                 const errorMessage = `Error analyzing email ${email.id}: ${String(error)}`;
//                 errors.push(errorMessage);
//                 return {
//                     emailId: email.id,
//                     success: false,
//                     error: errorMessage,
//                 };
//             }
//         });

//         // Process batch with controlled concurrency
//         const batchResults = await Promise.all(batchPromises);
//         results.push(...batchResults);

//         // Brief pause between batches to prevent rate limiting
//         if (batchIndex < batches.length - 1) {
//             await new Promise((resolve) => setTimeout(resolve, 200));
//         }
//     }

//     return {
//         success: analyzedCount > 0,
//         analyzedCount,
//         totalCount: emails.length,
//         errors: errors.length > 0 ? errors : undefined,
//         results,
//     };
// }
