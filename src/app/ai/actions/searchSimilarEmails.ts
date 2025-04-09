'use server'

import { generateEmbedding } from '../utils/embedding';
import { findSimilarEmails } from '../utils/email';

export async function searchSimilarEmails(queryText: string, topK = 5) {
  try {
    // Generate embedding for the query text
    const embedding = await generateEmbedding(queryText);

    // Find similar emails using the generated embedding
    const results = await findSimilarEmails(embedding, topK);

    return results;
  } catch (error) {
    console.error('Error in searchSimilarEmails:', error);
    return { success: false, error: String(error) };
  }
}
