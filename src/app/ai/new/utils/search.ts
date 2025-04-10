'use server'

import index from '../index';
import { VECTOR_CONFIG } from '../constants';
import { cleanEmail } from './clean';
import type { Email } from '@/app/inbox/types';

// Define the search result type for better type safety
export type SearchResult = {
  id: string;
  score: number;
  metadata?: Record<string, any>;
}

export interface SearchResponse {
  success: boolean;
  error?: string;
  results: SearchResult[];
}

/**
 * Search for similar emails using vector similarity
 */
export async function searchSimilarEmails(emailOrContent: Email | string, userId?: string, options: { topK?: number } = {}): Promise<SearchResponse> {
  try {
    const { topK = 10 } = options;
    
    // Handle different input types
    let content: string;
    let userIdentifier: string | undefined;
    
    if (typeof emailOrContent === 'string') {
      // Direct text content provided
      content = emailOrContent;
      userIdentifier = userId;
    } else {
      // Email object provided
      content = cleanEmail(emailOrContent);
      userIdentifier = emailOrContent.userId;
    }
    
    // Validate content
    if (!content) {
      return { 
        success: false, 
        error: "Content too short for meaningful search",
        results: []
      };
    }
    
    // Security validation - must have valid userId
    if (!userIdentifier || typeof userIdentifier !== 'string') {
      return {
        success: false,
        error: "Invalid user ID for security filtering",
        results: []
      };
    }
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
    
    // Process and clean up the results 
    const formattedResults: SearchResult[] = Array.isArray(results) 
      ? results.map((match: any) => ({
          id: String(match.id || ''), 
          score: typeof match.score === 'number' ? match.score : 0,
          metadata: match.metadata || {}
        }))
      : [];
    
    return {
      success: true,
      results: formattedResults
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
export async function searchEmailsByQuery(query: string, userId: string, options: { topK?: number } = {}): Promise<SearchResponse> {
  try {
    // For text queries, just use the more general search function
    return searchSimilarEmails(query, userId, options);
  } catch (error) {
    console.error("Error in searchEmailsByQuery:", error);
    return { 
      success: false, 
      error: String(error),
      results: [] 
    };
  }
} 