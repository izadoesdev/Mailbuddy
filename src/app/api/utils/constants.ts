export const EXCLUDED_EMAILS = [
    "noreply*",
    "no-reply*",
    "donotreply*",
    "do-not-reply*",
    "do-not-reply",
    "notifications",
];

/**
 * Regex patterns to exclude automated senders from contacts
 * These patterns are used to filter out system accounts, bots, and notification services
 * from being displayed in the contacts list
 */
export const EXCLUDED_CONTACT_PATTERNS = [
    // No-reply variants
    /^noreply@/i,
    /^no-reply@/i,
    /^no\.reply@/i,
    /^donotreply@/i,
    /^do-not-reply@/i,
    /^do\.not\.reply@/i,

    // Notification services
    /^notifications?@/i,
    /^notify@/i,
    /^alerts?@/i,
    /^updates?@/i,

    // System accounts
    /^system@/i,
    /^admin@/i,
    /^administrator@/i,
    /^support@/i,
    /^help@/i,
    /^info@/i,

    // Marketing and promotional
    /^newsletter@/i,
    /^marketing@/i,
    /^promotions?@/i,
    /^offers?@/i,
    /^news@/i,

    // Common service accounts
    /^service@/i,
    /^services@/i,
    /^account@/i,
    /^accounts@/i,
    /^billing@/i,
    /^payments?@/i,
    /^orders?@/i,
    /^bookings?@/i,
    /^reservations?@/i,

    // Security related
    /^security@/i,
    /^verification@/i,
    /^verify@/i,
    /^2fa@/i,
    /^authentication@/i,
    /^auth@/i,
    /^mfa@/i,

    // Common customer service patterns
    /^feedback@/i,
    /^survey@/i,

    // Bot and automated emails
    /^bot@/i,
    /^automat(ed|ic)@/i,
    /^mailer-daemon@/i,
    /^mailbot@/i,
    /^robot@/i,

    // Generic mail addresses
    /^mail@/i,
    /^email@/i,
    /^postmaster@/i,

    // Common domains for automated emails
    /@donotreply\./i,
    /@no-reply\./i,
    /@noreply\./i,
    /@automated\./i,

    // Invalid or test addresses
    /^test@/i,
    /^example@/i,
    /^user@example/i,
];

/**
 * Helper function to check if an email should be excluded from contacts
 * @param email The email address to check
 * @returns True if the email should be excluded, false otherwise
 */
export function shouldExcludeFromContacts(email: string): boolean {
    if (!email) return true;

    // Convert to lowercase for case-insensitive matching
    const lowerEmail = email.toLowerCase();

    // Check against all patterns
    return EXCLUDED_CONTACT_PATTERNS.some((pattern) => pattern.test(lowerEmail));
}
