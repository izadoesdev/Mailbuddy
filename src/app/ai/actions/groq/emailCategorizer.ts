"use server"

import { getGroqClient, SYSTEM_PROMPTS, MODELS, processPrompt, processBatch } from "./index";
import { convert } from "html-to-text";
import pLimit from "p-limit";

// Categories we want to support
const EMAIL_CATEGORIES = [
  "Work",
  "Personal",
  "Marketing",
  "Financial",
  "Social",
  "Travel",
  "Shopping",
  "Updates",
  "Newsletters", 
  "Receipts",
  "Scheduling",
  "Support",
  "Alerts"
];

// Pre-defined prompt template for email categorization
const createCategoryPrompt = (email: string) => {
  const cleanedContent = prepareEmailContent(email);
  
  return `
Analyze this email and categorize it into exactly one of these categories: ${EMAIL_CATEGORIES.join(", ")}
Base your decision on the content, subject, and purpose of the email.
Respond with ONLY the category name.

EMAIL CONTENT:
${cleanedContent}
  `;
};

/**
 * Clean and prepare email content for AI processing
 */
function prepareEmailContent(content: string): string {
  if (!content) return "";
  
  // Convert HTML to plain text if needed
  let cleanedContent = content;
  if (content.includes("<") && content.includes(">")) {
    try {
      cleanedContent = convert(content, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
          { selector: 'img', format: 'skip' }
        ],
        limits: {
          maxInputLength: 50000
        }
      });
    } catch (error) {
      console.error("Error converting HTML:", error);
    }
  }
  
  // Ensure reasonable length for the API
  if (cleanedContent.length > 8000) {
    cleanedContent = cleanedContent.substring(0, 8000);
  }
  
  return cleanedContent;
}

/**
 * Categorize a single email using Groq
 */
export async function categorizeEmail(email: string) {
  // Create messages for the API call
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_CATEGORIZER },
    { role: "user" as const, content: createCategoryPrompt(email) }
  ];
  
  // Use the faster 8B model which is sufficient for categorization
  const result = await processPrompt(messages, MODELS.FAST, {
    temperature: 0.1 // Use low temperature for consistent categorization
  });
  
  if (!result.success) {
    console.error("Error categorizing email:", result.error);
    return "Uncategorized";
  }
  
  // Clean up the response to ensure it's just a category
  const response = result.content?.trim() || "Uncategorized";
  
  // Validate response is a proper category
  const matchedCategory = EMAIL_CATEGORIES.find(
    cat => response.toLowerCase().includes(cat.toLowerCase())
  );
  
  return matchedCategory || "Uncategorized";
}

/**
 * Categorize multiple emails efficiently with concurrency control
 */
export async function categorizeEmails(emails: string[]) {
  if (!emails.length) return [];
  
  // Create prompts for all emails
  const prompts = emails.map(email => ({
    messages: [
      { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_CATEGORIZER },
      { role: "user" as const, content: createCategoryPrompt(email) }
    ],
    model: MODELS.FAST
  }));
  
  // Process in batch with controlled concurrency
  const results = await processBatch(prompts, {
    temperature: 0.1
  });
  
  // Extract and clean results
  return results.map((result, index) => {
    if (!result.success) {
      console.error(`Error categorizing email at index ${index}:`, result.error);
      return "Uncategorized";
    }
    
    const response = result.content?.trim() || "Uncategorized";
    
    // Validate response is a proper category
    const matchedCategory = EMAIL_CATEGORIES.find(
      cat => response.toLowerCase().includes(cat.toLowerCase())
    );
    
    return matchedCategory || "Uncategorized";
  });
}
