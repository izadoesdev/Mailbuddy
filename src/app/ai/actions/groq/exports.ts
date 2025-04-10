"use server"

// Import from utils
import { 
  SYSTEM_PROMPTS,
  MODELS,
} from '@/app/ai/utils/groq';
import type { EmailInput, ProcessOptions } from '@/app/ai/utils/groq';

// Import all required modules directly to avoid linter errors
import { 
  getGroqClient,
  processBatch,
  processPrompt,
  createPromptFunction
} from './index';

import { 
  categorizeEmail,
  categorizeEmails
} from './emailCategorizer';

import {
  summarizeEmail,
  summarizeEmails
} from './emailSummarizer';

import {
  prioritizeEmail,
  prioritizeEmails,
} from './emailPrioritizer';

import { PRIORITY_LEVELS } from '@/app/ai/utils/emailProcessing';

import {
  saveEmailAIMetadata,
  getEmailAIMetadata,
  getMultipleEmailAIMetadata,
  getEmailsByCategory,
  getEmailsByPriority
} from './aiMetadataService';

/**
 * Process a single email with all AI capabilities and save results to database
 * Checks for existing metadata first to avoid redundant processing
 */
export async function processEmail(email: EmailInput, options?: ProcessOptions) {
  try {
    // Check if we already have metadata for this email
    if (!options?.forceReprocess) {
      const existingMetadata = await getEmailAIMetadata(email.id);
      if (existingMetadata.success && existingMetadata.metadata) {
        // Return existing metadata if available
        return {
          id: email.id,
          category: existingMetadata.metadata.category || "Uncategorized",
          summary: existingMetadata.metadata.summary || "No summary available",
          priority: existingMetadata.metadata.priority || PRIORITY_LEVELS.MEDIUM,
          priorityExplanation: existingMetadata.metadata.priorityExplanation || "",
          processed: true,
          fromCache: true
        };
      }
    }
    
    // Start timing
    const startTime = Date.now();
    
    // Run AI processes in parallel for better performance
    const [category, summary, priority] = await Promise.all([
      categorizeEmail(email.body),
      summarizeEmail(email.subject, email.body),
      prioritizeEmail(email)
    ]);
    
    // Calculate processing time
    const processingTime = Date.now() - startTime;
    
    // Save results to database
    await saveEmailAIMetadata({
      emailId: email.id,
      category,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      summary,
      processingTime,
      modelUsed: options?.modelOverride || "multiple", // Default to "multiple" for mixed model usage
    });
    
    return {
      id: email.id,
      category,
      summary,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      processed: true,
      fromCache: false,
      processingTime
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

/**
 * Process multiple emails efficiently with database caching
 */
export async function processEmails(emails: EmailInput[], options?: ProcessOptions) {
  if (!emails.length) return [];
  
  // Prepare results array
  const results = [];
  
  // Get IDs of all emails
  const emailIds = emails.map(e => e.id);
  
  // Only process emails that don't have existing metadata
  let emailsToProcess = [...emails];
  
  if (!options?.forceReprocess) {
    // Check for existing metadata
    const existingMetadataResult = await getMultipleEmailAIMetadata(emailIds);
    
    if (existingMetadataResult.success && existingMetadataResult.metadata) {
      const metadataItems = existingMetadataResult.metadata;
      
      if (metadataItems.length > 0) {
        // Create a map for quick lookups
        const metadataMap = new Map();
        
        // Safely populate the map with properly typed metadata
        for (const item of metadataItems) {
          if (item && typeof item === 'object' && 'emailId' in item) {
            metadataMap.set(item.emailId, item);
          }
        }
        
        // Add cached results to the results array
        for (const email of emails) {
          const metadata = metadataMap.get(email.id);
          
          if (metadata) {
            results.push({
              id: email.id,
              category: metadata.category || "Uncategorized",
              summary: metadata.summary || "No summary available",
              priority: metadata.priority || PRIORITY_LEVELS.MEDIUM,
              priorityExplanation: metadata.priorityExplanation || "",
              processed: true,
              fromCache: true
            });
          }
        }
        
        // Filter out emails that already have metadata
        emailsToProcess = emails.filter(email => !metadataMap.has(email.id));
      }
    }
  }
  
  // If there are no emails left to process, return cached results
  if (emailsToProcess.length === 0) {
    return results;
  }
  
  // Start timing
  const startTime = Date.now();
  
  // Process remaining emails in batches
  const [categories, summaries, priorities] = await Promise.all([
    categorizeEmails(emailsToProcess.map(e => e.body)),
    summarizeEmails(emailsToProcess.map(e => ({ subject: e.subject, body: e.body }))),
    prioritizeEmails(emailsToProcess)
  ]);
  
  // Calculate processing time
  const processingTime = Date.now() - startTime;
  
  // Combine results and save to database
  for (let i = 0; i < emailsToProcess.length; i++) {
    const email = emailsToProcess[i];
    const category = categories[i];
    const summary = summaries[i];
    const priority = priorities[i];
    
    // Save to database in a non-blocking way
    saveEmailAIMetadata({
      emailId: email.id,
      category,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      summary,
      processingTime: Math.floor(processingTime / emailsToProcess.length), // Average time per email
      modelUsed: options?.modelOverride || "multiple",
    }).catch(err => {
      console.error(`Failed to save metadata for email ${email.id}:`, err);
    });
    
    // Add to results array
    results.push({
      id: email.id,
      category,
      summary,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      processed: true,
      fromCache: false,
      processingTime: Math.floor(processingTime / emailsToProcess.length)
    });
  }
  
  return results;
} 