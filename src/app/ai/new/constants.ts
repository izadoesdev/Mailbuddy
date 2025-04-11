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
    "Alerts",
    "Educational",
    "Invoices",
    "Shipping",
    "Legal",
    "Healthcare",
    "Events",
    "Promotions",
    "Job",
    "Entertainment",
    "Food",
    "Technology",
    "Security",
];

/**
 * Common email signature patterns to identify and remove
 */
export const SIGNATURE_PATTERNS = [
    /^--\s*$/m, // Standard signature separator
    /^-- $/m, // Another common separator
    /^__+$/m, // Underscores separator
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
    /^Best,\s*$/im,
    /^Cheers,\s*$/im,
    /^Yours truly,\s*$/im,
    /^Cordially,\s*$/im,
    /^Warm regards,\s*$/im,
    /^With appreciation,\s*$/im,
];

/**
 * Common reply/forward patterns to identify email chains
 */
export const REPLY_PATTERNS = [
    /^On\s.*wrote:$/m, // Common in many email clients
    /^From:.*$/m, // Forward/reply header
    /^Sent:.*$/m, // Forward/reply header
    /^To:.*$/m, // Forward/reply header
    /^Subject:.*$/m, // Forward/reply header
    /^Date:.*$/m, // Forward/reply header
    /^-{3,}Original Message-{3,}/m, // Original message separator
    /^-{3,}Forwarded Message-{3,}/m, // Forwarded message separator
    /^>{1,}\s.*$/m, // Quoted reply text
    /^\[mailto:.*\]$/m, // Mailto line
    /^Begin forwarded message:$/m, // Apple Mail forward
    /^-+ Forwarded by -+$/m, // Another forward pattern
    /^-+ Begin forwarded message -+$/m, // Another forward pattern
    /^-+ Original message -+$/m, // Original message separator
];

/**
 * Email cleaning settings
 */
export const EMAIL_CLEANING = {
    MAX_CONTENT_LENGTH: 8000, // Maximum combined length for embedding
    MIN_CONTENT_LENGTH: 10, // Minimum content length to consider valid
    MAX_METADATA_SIZE: 1024, // Maximum metadata size in bytes
    TRUNCATE_SUBJECT: 200, // Maximum length for subject in metadata
    TRUNCATE_SENDER: 100, // Maximum length for sender in metadata
    TRUNCATE_RECIPIENT: 100, // Maximum length for recipient in metadata
};

/**
 * Vector database configuration
 */
export const VECTOR_CONFIG = {
    UPSTASH_BATCH_SIZE: 10, // Maximum batch size for Upstash Vector upserts
    RETRY_ATTEMPTS: 3, // Number of retry attempts for vector operations
    RETRY_DELAY_MS: 1000, // Delay between retries in milliseconds
    EMBEDDING_DIMENSIONS: 1536, // Default dimension for OpenAI embeddings
    NAMESPACE_PREFIX: "user_", // Prefix for user namespaces
    DEFAULT_NAMESPACE: "global", // Default namespace for vectors not associated with a user
};

/**
 * AI processing prompts
 */
export const AI_PROMPTS = {
    CATEGORIZE: `Analyze this email that was sent to the user and determine the most appropriate category from this list: ${EMAIL_CATEGORIES.join(", ")}. 
               Respond with only the category name.`,

    PRIORITIZE: `Based on the content, urgency, and importance of this email to the user receiving it, assign a priority level from these options: 
               ${Object.values(PRIORITY_LEVELS).join(", ")}. 
               Consider how important and time-sensitive it is for the user to respond or take action.
               Respond with only the priority level.`,

    SUMMARIZE: `Provide a concise summary of this email in 1-2 sentences highlighting key information, 
              requests, or action items directly to you as the reader. Use second-person perspective (using "you" and "your") 
              to address the reader directly. For example, say "It encourages you to engage" instead of "It encourages the user to engage".
              Keep it under 200 characters.`,

    EXTRACT_ACTION_ITEMS: `Extract specific action items or tasks requested of the user in this email. 
                         Focus only on what the user needs to do.
                         Format as a list with deadlines if mentioned. 
                         If no action items are present for the user, respond with "No action items".`,

    EXTRACT_CONTACT_INFO: `Extract any contact information present in this email including names, 
                         email addresses, phone numbers, and addresses of the sender or other contacts mentioned. 
                         Format as structured data. If none found, respond with "No contact information".`,
};

/**
 * Processing batch sizes
 */
export const BATCH_SIZES = {
    EMAIL_PROCESSING: 5, // Process this many emails at once
    VECTOR_STORAGE: 10, // Store this many vectors at once
    DATABASE_WRITES: 50, // Write this many records at once to the database
};

/**
 * Email content types
 */
export const CONTENT_TYPES = {
    HTML: "text/html",
    PLAIN: "text/plain",
    RICH: "text/richtext",
    MARKDOWN: "text/markdown",
};
