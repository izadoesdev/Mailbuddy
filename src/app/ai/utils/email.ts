import { vector } from './embedding';
import { convert } from 'html-to-text';

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
const MAX_CONTENT_LENGTH = 8000;

/**
 * Clean email body text to remove signatures, quoted replies, etc.
 */
function cleanEmailBody(body: string): string {
  if (!body) return '';
  
  let cleanedText = body;
  
  // Remove email signatures (simple approach)
  const signaturePatterns = [
    /^--\s*$/m, // Standard signature separator
    /^--[\s\S]*$/m, // Everything after signature separator
    /Best regards,[\s\S]*$/i,
    /Thanks,[\s\S]*$/i,
    /Regards,[\s\S]*$/i,
    /Sincerely,[\s\S]*$/i,
    /Cheers,[\s\S]*$/i
  ];
  
  for (const pattern of signaturePatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Remove email reply quotes
  const replyPatterns = [
    /On.*wrote:[\s\S]*$/m, // Standard reply pattern
    /From:.*Sent:.*To:.*Subject:[\s\S]*$/m, // Outlook-style headers
    /^>.*$/gm, // Lines starting with >
    /^On\s+[\s\S]*?wrote:[\s\S]*$/m, // Reply intro line and everything after
    /\s*------ Original Message ------[\s\S]*$/m, // Original message marker and everything after
    /\s*-+ Forwarded message -+[\s\S]*$/m // Forwarded message marker and everything after
  ];
  
  for (const pattern of replyPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Remove unsubscribe links and footers
  const footerPatterns = [
    /\s*Unsubscribe:?\s+https?:\/\/[^\s]+/gi,
    /\s*To unsubscribe,?\s+click here:?\s+https?:\/\/[^\s]+/gi,
    /\s*View this email in your browser:?\s+https?:\/\/[^\s]+/gi,
    /\s*This email was sent to[\s\S]*$/i
  ];
  
  for (const pattern of footerPatterns) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Clean up extra whitespace and normalize line endings
  cleanedText = cleanedText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // Convert HTML to plain text
  try {
    if (cleanedText.includes("<") && cleanedText.includes(">")) {
      cleanedText = convert(cleanedText, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true, noAnchorUrl: true } },
          { selector: 'img', options: { format: 'skip' } },
          { selector: 'style', options: { format: 'skip' } },
          { selector: 'script', options: { format: 'skip' } },
          { selector: 'head', options: { format: 'skip' } },
          { selector: 'hr', options: { format: 'skip' } },
          { selector: 'br', options: { format: 'linebreak' } }
        ],
        wordwrap: false,
        preserveNewlines: true
      });
    }
  } catch (error) {
    console.error("Error converting HTML:", error);
  }
  
  return cleanedText;
}

/**
 * Prepare email content for embedding by combining and cleaning
 */
export function prepareEmailContent(email: EmailData): string {
  const subject = email.subject?.trim() || '';
  const rawBody = email.body?.trim() || '';
  
  // Clean the body text to remove signatures, replies, etc.
  const cleanedBody = cleanEmailBody(rawBody);
  
  // Combine subject and cleaned body
  let content = '';
  
  if (subject) {
    content += subject;
    
    if (cleanedBody) {
      content += '\n\n';
    }
  }
  
  if (cleanedBody) {
    // If the combined content would be too long, truncate as needed
    const maxBodyLength = Math.max(0, MAX_CONTENT_LENGTH - content.length);
    content += cleanedBody.length > maxBodyLength ? 
      cleanedBody.substring(0, maxBodyLength) : 
      cleanedBody;
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