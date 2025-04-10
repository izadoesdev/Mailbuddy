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
  
  // Convert HTML to plain text if needed
  let cleanedContent = content;
  if (content.includes("<") && content.includes(">")) {
    try {
      cleanedContent = convert(content, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
          { selector: 'img', format: 'skip' }
        ],
        limits: {
          maxInputLength: 50000
        }
      });
    } catch (error) {
      console.error("Error converting HTML:", error);
    }
  }
  
  // Ensure reasonable length for the API
  if (cleanedContent.length > 8000) {
    cleanedContent = cleanedContent.substring(0, 8000);
  }
  
  return cleanedContent;
}

/**
 * Clean and prepare email content for summarization
 */
export function prepareEmailContentForSummarization(subject: string, content: string): string {
  if (!content) return subject || "";
  
  const cleanedSubject = subject || "No Subject";
  
  // Convert HTML to plain text if needed
  let cleanedContent = content;
  if (content.includes("<") && content.includes(">")) {
    try {
      cleanedContent = convert(content, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
          { selector: 'img', format: 'skip' }
        ],
        limits: {
          maxInputLength: 50000
        }
      });
    } catch (error) {
      console.error("Error converting HTML:", error);
    }
  }
  
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
  const body = email.body || "";
  const from = email.from || "Unknown Sender";
  const to = email.to || "";
  const date = email.createdAt ? new Date(email.createdAt).toISOString() : new Date().toISOString();
  
  // Convert HTML to plain text if needed
  let cleanedBody = body;
  if (body.includes("<") && body.includes(">")) {
    try {
      cleanedBody = convert(body, {
        selectors: [
          { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
          { selector: 'img', format: 'skip' }
        ],
        limits: {
          maxInputLength: 50000
        }
      });
    } catch (error) {
      console.error("Error converting HTML:", error);
    }
  }
  
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