'use server'

import { generateEmbedding } from '../utils/embedding';
import { storeEmail, type EmailData } from '../utils/email';

// Maximum content length to process
const MAX_CONTENT_LENGTH = 8000;

/**
 * Process email content to prepare for embedding
 */
function prepareEmailContent(email: EmailData): string {
  const subject = email.subject?.trim() || '';
  const body = email.body?.trim() || '';
  
  // Start with the subject which is usually most important
  let content = subject;
  
  // Add the body with a separator if both exist
  if (subject && body) {
    content += '\n\n';
  }
  
  // Add body (or just use body if no subject)
  if (body) {
    // If the combined content would be too long, truncate the body
    const maxBodyLength = Math.max(0, MAX_CONTENT_LENGTH - content.length);
    content += body.length > maxBodyLength ? body.substring(0, maxBodyLength) : body;
  }
  
  return content;
}

export async function storeEmailEmbedding(email: EmailData) {
  try {
    // Check if we have any content to embed
    if (!email.subject && !email.body) {
      return { success: false, error: "No content to embed" };
    }
    
    // Process email content to a reasonable length
    const content = prepareEmailContent(email);
    
    // Generate embedding for the email content
    const embedding = await generateEmbedding(content);

    // Store email with the generated embedding
    const result = await storeEmail(email, embedding);

    return result;
  } catch (error) {
    console.error('Error in storeEmailEmbedding:', error);
    return { success: false, error: String(error) };
  }
}
