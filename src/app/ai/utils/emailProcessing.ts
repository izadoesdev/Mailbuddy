import { convert } from "html-to-text";

// Priority levels for email classification
export const PRIORITY_LEVELS = {
  URGENT: "Urgent",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

// Categories we want to support
export const EMAIL_CATEGORIES = [
  "Work",
  "Personal",
  "Marketing",
  "Financial",
  "Social",
  "Travel",
  "Shopping",
  "Updates",
  "Newsletters", 
  "Receipts",
  "Scheduling",
  "Support",
  "Alerts"
];

/**
 * Common email signature patterns to identify and remove
 */
const SIGNATURE_PATTERNS = [
  /^--\s*$/m, // Standard signature separator
  /^-- $/m,   // Another common separator
  /^__+$/m,   // Underscores separator
  /^-{3,}$/m, // Dash separator
  /^~{3,}$/m, // Tilde separator
  /^[_\-~*]{2,}$/m, // Mixed separators
  /^[\s]*Regards,$/im,
  /^[\s]*Best regards,$/im,
  /^[\s]*Kind regards,$/im,
  /^[\s]*Sincerely,$/im,
  /^[\s]*Thanks[,.]?$/im,
  /^[\s]*Thank you[,.]?$/im,
  /^Sent from my (iPhone|iPad|Android|Galaxy|Phone|Mobile|BlackBerry|Windows Phone)/im,
  /^Get Outlook for (iOS|Android)/im,
];

/**
 * Common reply/forward patterns to identify email chains
 */
const REPLY_PATTERNS = [
  /^On\s.*wrote:$/m, // Common in many email clients
  /^From:.*$/m,       // Forward/reply header
  /^Sent:.*$/m,       // Forward/reply header
  /^To:.*$/m,         // Forward/reply header
  /^Subject:.*$/m,    // Forward/reply header
  /^Date:.*$/m,       // Forward/reply header
  /^-{3,}Original Message-{3,}/m, // Original message separator
  /^-{3,}Forwarded Message-{3,}/m, // Forwarded message separator
  /^>{1,}\s.*$/m,     // Quoted reply text
  /^\[mailto:.*\]$/m, // Mailto line
];

/**
 * Clean HTML content and return plain text
 */
function stripHtml(content: string): string {
  if (!content) return "";
  
  try {
    if (content.includes("<") && content.includes(">")) {
      return convert(content, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true, noAnchorUrl: true } },
          { selector: 'img', format: 'skip' },
          { selector: 'style', format: 'skip' },
          { selector: 'script', format: 'skip' },
          { selector: 'head', format: 'skip' },
          { selector: 'hr', format: 'skip' },
          { selector: 'br', format: 'linebreak' }
        ],
        limits: {
          maxInputLength: 100000
        },
        wordwrap: false,
        preserveNewlines: true
      });
    }
  } catch (error) {
    console.error("Error converting HTML:", error);
  }
  
  return content;
}

/**
 * Remove email signatures
 */
function removeSignatures(content: string): string {
  if (!content) return "";
  
  let result = content;
  
  // Check each signature pattern
  for (const pattern of SIGNATURE_PATTERNS) {
    const match = result.match(pattern);
    if (match && match.index !== undefined) {
      // Found a signature marker - truncate content at this point
      result = result.substring(0, match.index).trim();
    }
  }
  
  return result;
}

/**
 * Extract just the latest message from an email thread
 */
function extractLatestMessage(content: string): string {
  if (!content) return "";
  
  const lines = content.split('\n');
  const cleanedLines = [];
  
  // Scan line by line
  for (const line of lines) {
    // Check if this line starts a reply section
    const isReplyLine = REPLY_PATTERNS.some(pattern => pattern.test(line));
    
    if (isReplyLine) {
      // Stop processing once we hit a reply marker
      break;
    }
    
    cleanedLines.push(line);
  }
  
  // If nothing left or we couldn't identify sections, return the original
  if (cleanedLines.length === 0) {
    // Just remove quoted lines starting with >
    return content.replace(/^>+.*$/gm, '').trim();
  }
  
  return cleanedLines.join('\n').trim();
}

/**
 * Remove excess whitespace, including blank lines
 */
function normalizeWhitespace(content: string): string {
  if (!content) return "";
  
  // Replace multiple blank lines with a single one
  return content
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Master cleaning function that applies all processing steps
 */
function cleanEmail(content: string): string {
  let result = content;
  
  // Apply each cleaning step in sequence
  result = stripHtml(result);
  result = extractLatestMessage(result);
  result = removeSignatures(result);
  result = normalizeWhitespace(result);
  
  return result;
}

// Pre-defined prompt template for email categorization
export const createCategoryPrompt = (email: string) => {
  const cleanedContent = prepareEmailContentForCategorization(email);
  
  return `
Analyze this email and categorize it into exactly one of these categories: ${EMAIL_CATEGORIES.join(", ")}
Base your decision on the content, subject, and purpose of the email.
Respond with ONLY the category name.

EMAIL CONTENT:
${cleanedContent}
  `;
};

/**
 * Clean and prepare email content for categorization
 */
export function prepareEmailContentForCategorization(content: string): string {
  if (!content) return "";
  
  // Apply all cleaning steps
  const cleanedContent = cleanEmail(content);
  
  // Ensure reasonable length for the API
  if (cleanedContent.length > 8000) {
    return cleanedContent.substring(0, 8000);
  }
  
  return cleanedContent;
}

/**
 * Clean and prepare email content for summarization
 */
export function prepareEmailContentForSummarization(subject: string, content: string): string {
  if (!content) return subject || "";
  
  const cleanedSubject = subject || "No Subject";
  
  // Apply all cleaning steps
  const cleanedContent = cleanEmail(content);
  
  // Combine subject and content
  const fullContent = `Subject: ${cleanedSubject}\n\n${cleanedContent}`;
  
  // Ensure reasonable length for the API
  const MAX_LENGTH = 16000; // Longer context for summarization
  if (fullContent.length > MAX_LENGTH) {
    return fullContent.substring(0, MAX_LENGTH);
  }
  
  return fullContent;
}

/**
 * Clean and prepare email content for prioritization
 */
export function prepareEmailContentForPrioritization(
  email: { 
    subject: string; 
    body: string; 
    from?: string; 
    to?: string;
    createdAt?: Date | string;
  }
): string {
  const subject = email.subject || "No Subject";
  const from = email.from || "Unknown Sender";
  const to = email.to || "";
  const date = email.createdAt ? new Date(email.createdAt).toISOString() : new Date().toISOString();
  
  // Apply all cleaning steps
  const cleanedBody = cleanEmail(email.body || "");
  
  // Combine all email parts into a structured format
  const structuredEmail = `
From: ${from}
To: ${to}
Date: ${date}
Subject: ${subject}

${cleanedBody}
  `.trim();
  
  // Ensure reasonable length for the API
  const MAX_LENGTH = 8000;
  if (structuredEmail.length > MAX_LENGTH) {
    return structuredEmail.substring(0, MAX_LENGTH);
  }
  
  return structuredEmail;
} 