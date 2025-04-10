"use server"

import { categorizeEmail, categorizeEmails } from './emailCategorizer';
import { prioritizeEmail, prioritizeEmails } from './emailPrioritizer';
import { summarizeEmail, summarizeEmails } from './emailSummarizer';

// Export all Groq-related functionality from a single file

// Core functionality and prompts
export {
  getGroqClient,
  processBatch,
  processPrompt,
  createPromptFunction,
  SYSTEM_PROMPTS,
  MODELS
} from './index';

// Email categorization
export {
  categorizeEmail,
  categorizeEmails,
} from './emailCategorizer';

// Email summarization
export {
  summarizeEmail,
  summarizeEmails,
} from './emailSummarizer';

// Email prioritization
export {
  prioritizeEmail,
  prioritizeEmails,
  PRIORITY_LEVELS
} from './emailPrioritizer';

// Sample usage pattern for email processing with all services
export async function processEmail(email: {
  id: string;
  subject: string;
  body: string;
  from?: string;
  to?: string;
  createdAt?: Date | string;
}) {
  try {
    // Run these in parallel for better performance
    const [category, summary, priority] = await Promise.all([
      categorizeEmail(email.body),
      summarizeEmail(email.subject, email.body),
      prioritizeEmail(email)
    ]);
    
    return {
      id: email.id,
      category,
      summary,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      processed: true
    };
  } catch (error) {
    console.error('Error processing email with Groq:', error);
    return {
      id: email.id,
      processed: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

// Process multiple emails efficiently
export async function processEmails(emails: Array<{
  id: string;
  subject: string;
  body: string;
  from?: string;
  to?: string;
  createdAt?: Date | string;
}>) {
  if (!emails.length) return [];
  
  // Process categories and priorities in batches
  const [categories, summaries, priorities] = await Promise.all([
    categorizeEmails(emails.map(e => e.body)),
    summarizeEmails(emails.map(e => ({ subject: e.subject, body: e.body }))),
    prioritizeEmails(emails)
  ]);
  
  // Combine results
  return emails.map((email, i) => ({
    id: email.id,
    category: categories[i],
    summary: summaries[i],
    priority: priorities[i].priority,
    priorityExplanation: priorities[i].explanation,
    processed: true
  }));
} 