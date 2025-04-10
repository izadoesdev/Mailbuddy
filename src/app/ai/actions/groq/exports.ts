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

// Helper for logging
const log = (message: string, data?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] [Email Processing] ${message}`, data ? data : "");
};

/**
 * Process a single email with all AI capabilities and save results to database
 * Checks for existing metadata first to avoid redundant processing
 */
export async function processEmail(email: EmailInput, options?: ProcessOptions) {
  const startTime = Date.now();
  log(`Starting to process email ${email.id}`, { 
    subject: email.subject,
    forceReprocess: options?.forceReprocess || false 
  });

  try {
    // Check if we already have metadata for this email
    if (!options?.forceReprocess) {
      log(`Checking for existing metadata for email ${email.id}`);
      const existingMetadata = await getEmailAIMetadata(email.id);
      
      if (existingMetadata.success && existingMetadata.metadata) {
        // Return existing metadata if available
        const duration = Date.now() - startTime;
        log(`Found existing metadata for email ${email.id}, returning cached result (${duration}ms)`, {
          category: existingMetadata.metadata.category,
          priority: existingMetadata.metadata.priority
        });
        
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
      
      log(`No existing metadata found for email ${email.id}, will process with AI`);
    } else {
      log(`Force reprocessing email ${email.id}`);
    }
    
    // Run AI processes in parallel for better performance
    log(`Starting parallel AI processing for email ${email.id}`);
    const processingStartTime = Date.now();
    
    const [category, summary, priority] = await Promise.all([
      categorizeEmail(email.body).then(result => {
        log(`Category result for email ${email.id}: ${result}`);
        return result;
      }),
      summarizeEmail(email.subject, email.body).then(result => {
        log(`Summary generated for email ${email.id}: ${result.substring(0, 50)}${result.length > 50 ? '...' : ''}`);
        return result;
      }),
      prioritizeEmail(email).then(result => {
        log(`Priority determined for email ${email.id}: ${result.priority}`, {
          explanation: result.explanation
        });
        return result;
      })
    ]);
    
    // Calculate processing time
    const processingTime = Date.now() - processingStartTime;
    log(`Parallel AI processing completed in ${processingTime}ms for email ${email.id}`);
    
    // Save results to database
    log(`Saving AI metadata to database for email ${email.id}`);
    await saveEmailAIMetadata({
      emailId: email.id,
      category,
      priority: priority.priority,
      priorityExplanation: priority.explanation,
      summary,
      processingTime,
      modelUsed: options?.modelOverride || "multiple", // Default to "multiple" for mixed model usage
    });
    
    const totalDuration = Date.now() - startTime;
    log(`Email ${email.id} processing completed in ${totalDuration}ms`, {
      category,
      priority: priority.priority,
      processingTime,
      totalDuration
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const duration = Date.now() - startTime;
    log(`Error processing email ${email.id} (${duration}ms): ${errorMessage}`, { error });
    
    console.error('Error processing email with Groq:', error);
    return {
      id: email.id,
      processed: false,
      error: errorMessage
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