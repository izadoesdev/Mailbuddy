'use server'

import { generateEmbedding } from '../utils/embedding';
import { storeEmail, type EmailData, prepareEmailContent } from '../utils/email';

export async function storeEmailEmbedding(email: EmailData) {
  try {
    // Check if we have any content to embed
    if (!email.subject && !email.body) {
      return { success: false, error: "No content to embed" };
    }
    
    // Process email content using our improved cleaning function
    const content = prepareEmailContent(email);
    
    // Generate embedding for the clean email content
    const embedding = await generateEmbedding(content);

    // Store email with the generated embedding
    const result = await storeEmail(email, embedding);

    return result;
  } catch (error) {
    console.error('Error in storeEmailEmbedding:', error);
    return { success: false, error: String(error) };
  }
}
