"use server"

import { SYSTEM_PROMPTS, MODELS } from "@/app/ai/utils/groq";
import { processPrompt, processBatch } from "./index";
import { prepareEmailContentForPrioritization, PRIORITY_LEVELS } from "@/app/ai/utils/emailProcessing";

/**
 * Determine the priority level of an email
 */
export async function prioritizeEmail(email: { subject: string; body: string; from?: string; to?: string; createdAt?: Date | string }) {
  const content = prepareEmailContentForPrioritization(email);
  
  const messages = [
    { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_PRIORITIZER },
    { role: "user" as const, content: `
Analyze this email and determine its priority level from these options: Urgent, High, Medium, Low.
Consider factors like:
- Sender importance (if known)
- Explicit deadline mentions
- Request urgency
- Action requirements
- Time sensitivity

Email:
${content}

First line of your response must be ONLY the priority level.
On a second line, provide a brief 1-2 sentence justification.
` }
  ];
  
  // Use fast model for prioritization
  const result = await processPrompt(messages, MODELS.FAST, {
    temperature: 0.2
  });
  
  if (!result.success) {
    console.error("Error prioritizing email:", result.error);
    return {
      priority: PRIORITY_LEVELS.MEDIUM,
      explanation: "Unable to analyze priority"
    };
  }
  
  const response = result.content?.trim() || "";
  const lines = response.split('\n').filter(line => line.trim());
  
  // Extract priority from first line
  let priority = PRIORITY_LEVELS.MEDIUM; // Default
  if (lines.length > 0) {
    const firstLine = lines[0].trim().toLowerCase();
    if (firstLine.includes('urgent')) priority = PRIORITY_LEVELS.URGENT;
    else if (firstLine.includes('high')) priority = PRIORITY_LEVELS.HIGH;
    else if (firstLine.includes('medium')) priority = PRIORITY_LEVELS.MEDIUM;
    else if (firstLine.includes('low')) priority = PRIORITY_LEVELS.LOW;
  }
  
  // Extract explanation from second line or use default
  const explanation = lines.length > 1 ? lines.slice(1).join(' ').trim() : "No explanation provided";
  
  return {
    priority,
    explanation
  };
}

/**
 * Process multiple emails for prioritization with concurrency control
 */
export async function prioritizeEmails(emails: Array<{ subject: string; body: string; from?: string; to?: string; createdAt?: Date | string }>) {
  if (!emails.length) return [];
  
  // Create prompts for all emails
  const prompts = emails.map(email => {
    const content = prepareEmailContentForPrioritization(email);
    
    return {
      messages: [
        { role: "system" as const, content: SYSTEM_PROMPTS.EMAIL_PRIORITIZER },
        { role: "user" as const, content: `
Analyze this email and determine its priority level from these options: Urgent, High, Medium, Low.
Consider factors like:
- Sender importance (if known)
- Explicit deadline mentions
- Request urgency
- Action requirements
- Time sensitivity

Email:
${content}

First line of your response must be ONLY the priority level.
On a second line, provide a brief 1-2 sentence justification.
` }
      ],
      model: MODELS.FAST
    };
  });
  
  // Process in batch with controlled concurrency
  const results = await processBatch(prompts, {
    temperature: 0.2
  });
  
  // Extract and clean results
  return results.map((result, index) => {
    if (!result.success) {
      console.error(`Error prioritizing email at index ${index}:`, result.error);
      return {
        priority: PRIORITY_LEVELS.MEDIUM,
        explanation: "Unable to analyze priority"
      };
    }
    
    const response = result.content?.trim() || "";
    const lines = response.split('\n').filter(line => line.trim());
    
    // Extract priority from first line
    let priority = PRIORITY_LEVELS.MEDIUM; // Default
    if (lines.length > 0) {
      const firstLine = lines[0].trim().toLowerCase();
      if (firstLine.includes('urgent')) priority = PRIORITY_LEVELS.URGENT;
      else if (firstLine.includes('high')) priority = PRIORITY_LEVELS.HIGH;
      else if (firstLine.includes('medium')) priority = PRIORITY_LEVELS.MEDIUM;
      else if (firstLine.includes('low')) priority = PRIORITY_LEVELS.LOW;
    }
    
    // Extract explanation from second line or use default
    const explanation = lines.length > 1 ? lines.slice(1).join(' ').trim() : "No explanation provided";
    
    return {
      priority,
      explanation
    };
  });
} 