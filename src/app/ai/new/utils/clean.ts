import type { Email } from "@/app/inbox/types";
import { convert } from "html-to-text";
import { EMAIL_CLEANING, SIGNATURE_PATTERNS, REPLY_PATTERNS, CONTENT_TYPES } from "../constants";

/**
 * Clean email body text to remove signatures, quoted replies, etc.
 * @param body Email body to clean
 * @returns Cleaned text
 */
function cleanEmailBody(body: string): string {
  if (!body) return '';
  
  // Convert HTML to text if needed
  let cleanedText = body;
  
  // Check if this is HTML content
  if (body.includes("<") && body.includes(">")) {
    try {
      cleanedText = convert(body, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true, noAnchorUrl: true } },
          { selector: 'img', options: { format: 'skip' } },
          { selector: 'style', options: { format: 'skip' } },
          { selector: 'script', options: { format: 'skip' } },
          { selector: 'head', options: { format: 'skip' } },
        ],
        wordwrap: false,
        preserveNewlines: true
      });
    } catch (error) {
      console.error("[cleanEmailBody] HTML conversion error:", error);
      // Keep original if conversion fails
    }
  }
  
  // Remove email signatures
  for (const pattern of SIGNATURE_PATTERNS) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Remove email reply quotes
  for (const pattern of REPLY_PATTERNS) {
    cleanedText = cleanedText.replace(pattern, '');
  }
  
  // Clean up extra whitespace and normalize line endings
  cleanedText = cleanedText
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  
  return cleanedText;
}

/**
 * Cleans the body and subject of an email and combines them for embedding
 * @param email - The email to clean
 * @returns The cleaned content suitable for vector embedding
 */
export function cleanEmail(email: Email): string {
  // Clean the subject and body
  const subject = email.subject?.trim() || '';
  const cleanedBody = cleanEmailBody(email.body || '');
  
  // Combine subject and cleaned body
  let content = '';
  
  if (subject) {
    content += subject;
    
    if (cleanedBody) {
      content += '\n\n';
    }
  }
  
  if (cleanedBody) {
    // Limit content length to prevent overly large embeddings
    const maxBodyLength = Math.max(0, EMAIL_CLEANING.MAX_CONTENT_LENGTH - content.length);
    content += cleanedBody.length > maxBodyLength ? 
      cleanedBody.substring(0, maxBodyLength) : 
      cleanedBody;
  }
  
  return content;
}

/**
 * Cleans and formats email metadata for storage
 * @param email - The email to process
 * @returns Cleaned metadata object
 */
export function cleanMetadata(email: Email): Record<string, any> {
  const metadata: Record<string, any> = {
    userId: email.userId,
  };
  
  // Add subject with length limit
  if (email.subject) {
    metadata.subject = email.subject.substring(0, EMAIL_CLEANING.TRUNCATE_SUBJECT);
  }
  
  // Add createdAt as ISO string
  if (email.createdAt) {
    metadata.createdAt = typeof email.createdAt === 'string' 
      ? email.createdAt 
      : email.createdAt.toISOString();
  } else {
    metadata.createdAt = new Date().toISOString();
  }
  
  // Add from/to with length limits
  if (email.from) {
    metadata.from = email.from.substring(0, EMAIL_CLEANING.TRUNCATE_SENDER);
  }
  
  if (email.to) {
    metadata.to = email.to.substring(0, EMAIL_CLEANING.TRUNCATE_RECIPIENT);
  }
  
  // Add labels if they exist (limit to prevent metadata size issues)
  if (email.labels && Array.isArray(email.labels) && email.labels.length > 0) {
    // Only include the first few labels to control metadata size
    metadata.labels = email.labels.slice(0, 5);
  }
  
  return metadata;
}