'use server'

import { BATCH_SIZES } from '../constants';
import type { Email } from '@/app/inbox/types';
import { storeEmail } from './vectors';
import { processEmail } from './groq';
import { cleanEmail } from './clean';

/**
 * Process a batch of emails using AI and save them to the vector database
 */
export async function processBatchEmails(emails: Email[]) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return {
      success: false,
      error: "No emails to process",
      results: []
    };
  }
  
  const results: any[] = [];
  const errors: string[] = [];
  let processedCount = 0;
  
  // Divide into smaller batches for processing
  const batches: Email[][] = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZES.EMAIL_PROCESSING) {
    batches.push(emails.slice(i, i + BATCH_SIZES.EMAIL_PROCESSING));
  }
  
  // Process each batch
  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
    
    // Process each email in the batch
    const batchPromises = batch.map(async (email) => {
      try {
        // Skip emails with insufficient content
        const content = cleanEmail(email);
        if (!content || content.length < 30) {
          return {
            emailId: email.id,
            success: false,
            error: "Insufficient content for processing"
          };
        }
        
        // Process the email with AI
        const aiData = await processEmail(email);
        
        // Store in vector database
        const vectorResult = await storeEmail(email);
        
        if (!vectorResult.success) {
          return {
            emailId: email.id,
            success: false,
            error: `Vector storage failed: ${vectorResult.error}`,
            aiData
          };
        }
        
        processedCount++;
        
        return {
          emailId: email.id,
          success: true,
          aiData
        };
      } catch (error) {
        const errorMessage = `Error processing email ${email.id}: ${String(error)}`;
        errors.push(errorMessage);
        return {
          emailId: email.id,
          success: false,
          error: errorMessage
        };
      }
    });
    
    // Process batch with controlled concurrency
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Brief pause between batches to prevent rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return {
    success: processedCount > 0,
    processedCount,
    totalCount: emails.length,
    errors: errors.length > 0 ? errors : undefined,
    results
  };
}

/**
 * Store a batch of emails in the vector database without AI processing
 */
export async function storeBatchEmails(emails: Email[]) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return {
      success: false,
      error: "No emails to store",
      results: []
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
            success: true
          };
        } 
        
        const errorMessage = `Failed to store email ${email.id}: ${result.error}`;
        errors.push(errorMessage);
        return {
          emailId: email.id,
          success: false,
          error: errorMessage
        };
      } catch (error) {
        const errorMessage = `Error storing email ${email.id}: ${String(error)}`;
        errors.push(errorMessage);
        return {
          emailId: email.id,
          success: false,
          error: errorMessage
        };
      }
    });
    
    // Process batch with controlled concurrency
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Brief pause between batches to prevent rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return {
    success: successCount > 0,
    successCount,
    totalCount: emails.length,
    errors: errors.length > 0 ? errors : undefined,
    results
  };
}

/**
 * Enrich a batch of emails with AI metadata without storing them
 */
export async function analyzeBatchEmails(emails: Email[]) {
  if (!Array.isArray(emails) || emails.length === 0) {
    return {
      success: false,
      error: "No emails to analyze",
      results: []
    };
  }
  
  const results: any[] = [];
  const errors: string[] = [];
  let analyzedCount = 0;
  
  // Divide into smaller batches for analysis
  const batches: Email[][] = [];
  for (let i = 0; i < emails.length; i += BATCH_SIZES.EMAIL_PROCESSING) {
    batches.push(emails.slice(i, i + BATCH_SIZES.EMAIL_PROCESSING));
  }
  
  // Process each batch
  for (const [batchIndex, batch] of batches.entries()) {
    console.log(`Analyzing batch ${batchIndex + 1}/${batches.length} (${batch.length} emails)`);
    
    // Analyze each email in the batch
    const batchPromises = batch.map(async (email) => {
      try {
        const aiData = await processEmail(email);
        analyzedCount++;
        
        return {
          emailId: email.id,
          success: true,
          aiData
        };
      } catch (error) {
        const errorMessage = `Error analyzing email ${email.id}: ${String(error)}`;
        errors.push(errorMessage);
        return {
          emailId: email.id,
          success: false,
          error: errorMessage
        };
      }
    });
    
    // Process batch with controlled concurrency
    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
    
    // Brief pause between batches to prevent rate limiting
    if (batchIndex < batches.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 200));
    }
  }
  
  return {
    success: analyzedCount > 0,
    analyzedCount,
    totalCount: emails.length,
    errors: errors.length > 0 ? errors : undefined,
    results
  };
} 