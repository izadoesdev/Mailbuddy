"use server"

import { SYSTEM_PROMPTS, MODELS, processPrompt, processBatch } from "./index";
import { convert } from "html-to-text";

/**
 * Clean and prepare email content for AI processing
 */
function prepareEmailContent(subject: string, content: string): string {
  if (!content) return subject || "";
  
  const cleanedSubject = subject || "No Subject";
  
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
  
  // Combine subject and content
  const fullContent = `Subject: ${cleanedSubject}\n\n${cleanedContent}`;
  
  // Ensure reasonable length for the API
  const MAX_LENGTH = 16000; // Longer context for summarization
  if (fullContent.length > MAX_LENGTH) {
    return fullContent.substring(0, MAX_LENGTH);
  }
  
  return fullContent;
}

/**
 * Generate a concise summary for an email
 */
export async function summarizeEmail(subject: string, body: string) {
  const content = prepareEmailContent(subject, body);
  
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
    console.error("Error summarizing email:", result.error);
    return "Unable to generate summary";
  }
  
  return result.content?.trim() || "Unable to generate summary";
}

/**
 * Process multiple emails for summarization with concurrency control
 */
export async function summarizeEmails(emails: Array<{ subject: string, body: string }>) {
  if (!emails.length) return [];
  
  // Create prompts for all emails
  const prompts = emails.map(email => {
    const content = prepareEmailContent(email.subject, email.body);
    
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
      console.error(`Error summarizing email at index ${index}:`, result.error);
      return "Unable to generate summary";
    }
    
    return result.content?.trim() || "Unable to generate summary";
  });
} 