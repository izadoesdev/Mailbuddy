'use server'

/**
 * Main AI module that exports all AI functionality
 * 
 * This file serves as a central export point for all AI capabilities,
 * making it easier to import and use the AI features.
 */

// Import required functions for local use
import { processEmail } from './utils/groq';
import { storeEmail } from './utils/vectors';

// Vector operations
export { storeEmail, storeVector, queryVector, deleteVectors, batchStoreVectors } from './utils/vectors';

// Search operations 
export { searchSimilarEmails, searchEmailsByQuery } from './utils/search';

// Text analysis operations
export { categorizeEmail } from './utils/categorize';

// Email content processing
export { cleanEmail, cleanMetadata } from './utils/clean';

// Groq LLM functions
export { 
  categorizeEmail as groqCategorizeEmail,
  prioritizeEmail,
  summarizeEmail,
  extractActionItems,
  extractContactInfo,
  processEmail 
} from './utils/groq';

// Batch processing
export {
  processBatchEmails,
  storeBatchEmails,
  analyzeBatchEmails
} from './utils/batch';

// Constants
export { 
  EMAIL_CATEGORIES, 
  PRIORITY_LEVELS,
  EMAIL_CLEANING,
  VECTOR_CONFIG,
  AI_PROMPTS,
  BATCH_SIZES
} from './constants';

/**
 * Process an email with AI to extract useful information
 * 
 * This is a convenience function that combines multiple AI operations
 * into a single call for simpler usage.
 */
export async function enhanceEmail(email: any) {
  if (!email || !email.id || !email.userId) {
    return { success: false, error: "Invalid email data" };
  }
  
  try {
    // Process the email with Groq to extract all AI metadata at once
    const aiData = await processEmail(email);
    
    // Store the email in the vector database for future searches
    await storeEmail(email);
    
    return { 
      success: true, 
      data: {
        ...email,
        ...aiData
      }
    };
  } catch (error) {
    console.error("Error enhancing email:", error);
    return { success: false, error: String(error) };
  }
} 