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
    CATEGORIZE: `Analyze this email and determine up to 3 relevant categories from this list: ${EMAIL_CATEGORIES.join(", ")}. 
               Focus on the primary purpose first, then include secondary themes if relevant.
               Format response as comma-separated values (e.g., "Work, Scheduling, Updates").
               Do not include any other text or explanation.`,

    PRIORITIZE: `Determine the priority level of this email based on:
               - Time sensitivity (how soon action is needed)
               - Importance to the recipient
               - Consequences of delayed response
               
               Choose exactly ONE from: ${Object.values(PRIORITY_LEVELS).join(", ")}.
               Guidelines:
               - Urgent: Requires immediate attention (within hours)
               - High: Should be addressed today or tomorrow
               - Medium: Can wait a few days
               - Low: No time sensitivity
               
               Return ONLY the priority level name.`,

    SUMMARIZE: `Create a concise, actionable summary of this email that:
              - Addresses the recipient directly ("you" not "the user")
              - Focuses on the main purpose and key points
              - Highlights any deadlines or time-sensitive elements
              - Uses present tense and active voice
              - Is under 200 characters
              
              Return ONLY the summary with no prefixes or explanations.`,

    EXTRACT_ACTION_ITEMS: `Identify all specific actions the recipient needs to take based on this email.
                         Return as a JSON array of strings with these characteristics:
                         - Start each item with an action verb (review, respond, submit, etc.)
                         - Focus on concrete, specific tasks
                         - Include deadlines if mentioned
                         - Keep each item under 10 words
                         - Example format: ["respond to meeting invite by Friday", "review attached document"]
                         - If no actions required, return empty array []
                         
                         Return ONLY the valid JSON array with no other text.`,

    EXTRACT_CONTACT_INFO: `Extract contact information from this email including:
                         - Name(s)
                         - Email address(es)
                         - Phone number(s)
                         - Physical address(es)
                         
                         Return as a properly formatted JSON object:
                         {
                           "name": "Person name or null if not found",
                           "email": "Email address or null",
                           "phone": "Phone number or null",
                           "address": "Physical address or null"
                         }
                         
                         Return ONLY the JSON object with no other text.`,
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
