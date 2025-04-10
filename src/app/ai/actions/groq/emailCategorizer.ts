"use server"

import { SYSTEM_PROMPTS, MODELS } from "@/app/ai/utils/groq";
import { processPrompt, processBatch } from "./index";
import { prepareEmailContentForCategorization, createCategoryPrompt, EMAIL_CATEGORIES } from "@/app/ai/utils/emailProcessing";

// Helper for logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Email Categorizer] ${message}`, data ? data : "");
};

/**
 * Categorize a single email using Groq
 */
export async function categorizeEmail(email: string) {
  log("Creating category prompt for email", { contentLength: email.length });
  
  // Create messages for the API call
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_CATEGORIZER },
    { role: "user" as const, content: createCategoryPrompt(email) }
  ];
  
  // Use the faster 8B model which is sufficient for categorization
  log(`Sending categorization request to model ${MODELS.FAST}`);
  const result = await processPrompt(messages, MODELS.FAST, {
    temperature: 0.1 // Use low temperature for consistent categorization
  });
  
  if (!result.success) {
    log(`Error categorizing email: ${result.error}`);
    return "Uncategorized";
  }
  
  // Clean up the response to ensure it's just a category
  const response = result.content?.trim() || "Uncategorized";
  log(`Raw category response: "${response}"`);
  
  // Validate response is a proper category
  const matchedCategory = EMAIL_CATEGORIES.find(
    cat => response.toLowerCase().includes(cat.toLowerCase())
  );
  
  const finalCategory = matchedCategory || "Uncategorized";
  log(`Final category determination: "${finalCategory}"`, {
    matchedCategory,
    rawResponse: response
  });
  
  return finalCategory;
}

/**
 * Categorize multiple emails efficiently with concurrency control
 */
export async function categorizeEmails(emails: string[]) {
  if (!emails.length) return [];
  log(`Categorizing batch of ${emails.length} emails`);
  
  // Create prompts for all emails
  const prompts = emails.map(email => ({
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_CATEGORIZER },
      { role: "user" as const, content: createCategoryPrompt(email) }
    ],
    model: MODELS.FAST
  }));
  
  // Process in batch with controlled concurrency
  log(`Sending batch categorization request for ${emails.length} emails`);
  const results = await processBatch(prompts, {
    temperature: 0.1
  });
  
  // Extract and clean results
  return results.map((result, index) => {
    if (!result.success) {
      log(`Error categorizing email at index ${index}: ${result.error}`);
      return "Uncategorized";
    }
    
    const response = result.content?.trim() || "Uncategorized";
    
    // Validate response is a proper category
    const matchedCategory = EMAIL_CATEGORIES.find(
      cat => response.toLowerCase().includes(cat.toLowerCase())
    );
    
    const finalCategory = matchedCategory || "Uncategorized";
    log(`Email ${index} categorized as: "${finalCategory}"`);
    
    return finalCategory;
  });
}
