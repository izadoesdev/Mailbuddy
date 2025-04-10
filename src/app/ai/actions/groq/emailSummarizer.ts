"use server"

import { SYSTEM_PROMPTS, MODELS } from "@/app/ai/utils/groq";
import { processPrompt, processBatch } from "./index";
import { prepareEmailContentForSummarization } from "@/app/ai/utils/emailProcessing";

// Helper for logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Email Summarizer] ${message}`, data ? data : "");
};

// Prefixes to clean from summaries
const SUMMARY_PREFIXES = [
  "here is a concise summary of the email:",
  "here is a concise summary:",
  "here's a concise summary:",
  "here is a summary:",
  "here's a summary:",
  "summary:",
  "email summary:"
];

/**
 * Clean the summary text by removing common prefixes
 */
function cleanSummary(summary: string): string {
  let cleanedSummary = summary.trim();
  
  // Convert to lowercase for comparison, but keep original case for the result
  const lowerSummary = cleanedSummary.toLowerCase();
  
  // Check for and remove each prefix
  for (const prefix of SUMMARY_PREFIXES) {
    if (lowerSummary.startsWith(prefix)) {
      log(`Removing prefix "${prefix}" from summary`);
      cleanedSummary = cleanedSummary.substring(prefix.length).trim();
      break; // Only remove one prefix
    }
  }
  
  return cleanedSummary;
}

/**
 * Generate a concise summary for an email
 */
export async function summarizeEmail(subject: string, body: string) {
  const content = prepareEmailContentForSummarization(subject, body);
  log(`Summarizing email: "${subject}"`, { contentLength: content.length });
  
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_SUMMARIZER },
    { role: "user" as const, content: `
Summarize the following email concisely. Focus on:
1. The main purpose of the email
2. Any requests or action items
3. Important details or deadlines
4. Next steps (if any)

Email:
${content}

Keep the summary under 50 words.
` }
  ];
  
  // Use more powerful model for complex summarization task
  const result = await processPrompt(messages, MODELS.BALANCED, {
    temperature: 0.3
  });
  
  if (!result.success) {
    log(`Error summarizing email: ${result.error}`);
    return "Unable to generate summary";
  }
  
  const rawSummary = result.content?.trim() || "Unable to generate summary";
  log(`Raw summary response: ${rawSummary.substring(0, 100)}${rawSummary.length > 100 ? '...' : ''}`);
  
  // Clean the summary before returning
  const cleanedSummary = cleanSummary(rawSummary);
  log(`Cleaned summary: ${cleanedSummary.substring(0, 100)}${cleanedSummary.length > 100 ? '...' : ''}`);
  
  return cleanedSummary;
}

/**
 * Process multiple emails for summarization with concurrency control
 */
export async function summarizeEmails(emails: Array<{ subject: string, body: string }>) {
  if (!emails.length) return [];
  log(`Summarizing batch of ${emails.length} emails`);
  
  // Create prompts for all emails
  const prompts = emails.map(email => {
    const content = prepareEmailContentForSummarization(email.subject, email.body);
    
    return {
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_SUMMARIZER },
        { role: "user" as const, content: `
Summarize the following email concisely. Focus on:
1. The main purpose of the email
2. Any requests or action items
3. Important details or deadlines
4. Next steps (if any)

Email:
${content}

Keep the summary under 50 words.
` }
      ],
      model: MODELS.BALANCED
    };
  });
  
  // Process in batch with controlled concurrency
  const results = await processBatch(prompts, {
    temperature: 0.3
  });
  
  // Extract and clean results
  return results.map((result, index) => {
    if (!result.success) {
      log(`Error summarizing email at index ${index}: ${result.error}`);
      return "Unable to generate summary";
    }
    
    const rawSummary = result.content?.trim() || "Unable to generate summary";
    // Clean the summary before returning
    return cleanSummary(rawSummary);
  });
} 