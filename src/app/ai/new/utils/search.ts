'use server'

import index from '../index';
import { VECTOR_CONFIG } from '../constants';
import { cleanEmail } from './clean';
import type { Email } from '@/app/inbox/types';

/**
 * Search for similar emails using vector similarity
 */
export async function searchSimilarEmails(email: Email, options: { topK?: number } = {}) {
  try {
    const { topK = 10 } = options;
    
    // Clean and prepare email content for searching
    const content = cleanEmail(email);
    
    // Validate content
    if (!content || content.length < 10) {
      return { 
        success: false, 
        error: "Email content too short for meaningful search",
        results: []
      };
    }
    
    // Security validation - must have valid userId
    if (!email.userId || typeof email.userId !== 'string') {
      return {
        success: false,
        error: "Invalid user ID for security filtering",
        results: []
      };
    }
    
    // Create filter to only search user's documents (critical security measure)
    const filter = { userId: { $eq: email.userId } };
    
    // Perform search with retry logic
    let attempts = 0;
    let success = false;
    let lastError = null;
    let results = null;
    
    while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
      try {
        results = await index.index.query({
          data: content,
          topK,
          includeMetadata: true,
          filter: JSON.stringify(filter) // Convert filter to string as required by Upstash
        });
        success = true;
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
        }
      }
    }
    
    if (!success) {
      console.error("Error searching similar emails after retries:", lastError);
      return { 
        success: false, 
        error: String(lastError),
        results: []
      };
    }
    
    return {
      success: true,
      results: results|| []
    };
  } catch (error) {
    console.error("Error in searchSimilarEmails:", error);
    return { 
      success: false, 
      error: String(error),
      results: [] 
    };
  }
}

/**
 * Search for emails by text query
 */
export async function searchEmailsByQuery(query: string, userId: string, options: { topK?: number } = {}) {
  try {
    const { topK = 10 } = options;
    
    // Validate query
    if (!query || query.trim().length < 3) {
      return { 
        success: false, 
        error: "Search query too short (minimum 3 characters)",
        results: []
      };
    }
    
    // Security validation - must have valid userId
    if (!userId || typeof userId !== 'string') {
      return {
        success: false,
        error: "Invalid user ID for security filtering",
        results: []
      };
    }
    
    // Create filter to only search user's documents (critical security measure)
    const filter = { userId: { $eq: userId } };
    
    // Perform search with retry logic
    let attempts = 0;
    let success = false;
    let lastError = null;
    let results = null;
    
    while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
      try {
        results = await index.index.query({
          data: query,
          topK,
          includeMetadata: true,
          filter: JSON.stringify(filter) // Convert filter to string as required by Upstash
        });
        success = true;
      } catch (error) {
        lastError = error;
        attempts++;
        if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
        }
      }
    }
    
    if (!success) {
      console.error("Error searching emails by query after retries:", lastError);
      return { 
        success: false, 
        error: String(lastError),
        results: []
      };
    }
    
    return {
      success: true,
      results: results || []
    };
  } catch (error) {
    console.error("Error in searchEmailsByQuery:", error);
    return { 
      success: false, 
      error: String(error),
      results: [] 
    };
  }
} 