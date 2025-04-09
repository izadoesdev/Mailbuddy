import { vector } from './embedding';

export type EmailData = {
  id: string
  subject: string
  body: string
  userId: string
  createdAt?: Date
  from?: string
  to?: string
  labels?: string[]
}

// Maximum combined length to consider for embedding
const MAX_CONTENT_LENGTH = 5000;

/**
 * Prepare email content for embedding by combining and trimming
 */
function prepareEmailContent(email: EmailData): string {
  const subject = email.subject?.trim() || '';
  const body = email.body?.trim() || '';
  
  // Combine subject and body, prioritizing the subject
  let content = '';
  
  if (subject) {
    content += subject;
    
    // Add the body, but ensure we don't exceed the maximum length
    if (body) {
      content += '\n\n';
      
      // Calculate remaining space
      const remainingSpace = MAX_CONTENT_LENGTH - content.length;
      
      if (remainingSpace > 0 && body.length > remainingSpace) {
        // If body is too long, truncate it
        content += body.substring(0, remainingSpace);
      } else if (remainingSpace > 0) {
        content += body;
      }
    }
  } else if (body) {
    // No subject, just use the body (truncated if needed)
    content = body.length > MAX_CONTENT_LENGTH ? 
      body.substring(0, MAX_CONTENT_LENGTH) : body;
  }
  
  return content;
}

/**
 * Store an email embedding in the vector database
 */
export async function storeEmail(email: EmailData, embedding: number[]) {
  try {
    await vector.upsert({
      id: email.id,
      vector: embedding,
      metadata: {
        subject: email.subject,
        userId: email.userId,
        createdAt: email.createdAt ? email.createdAt.toISOString() : new Date().toISOString(),
        from: email.from || '',
        to: email.to || '',
      },
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error storing email in vector database:', error);
    throw error;
  }
}

/**
 * Find similar emails based on a vector embedding
 */
export async function findSimilarEmails(embedding: number[], topK = 5, userId?: string) {
  try {
    const query: any = {
      vector: embedding,
      topK,
      includeMetadata: true,
    };
    
    // Add filter by userId if provided
    if (userId) {
      query.filter = {
        userId: {
          $eq: userId,
        },
      };
    }
    
    const results = await vector.query(query);
    return results;
  } catch (error) {
    console.error('Error finding similar emails:', error);
    throw error;
  }
} 