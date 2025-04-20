/**
 * Extract name from email address string or use fromName if available
 */
export function extractName(emailString: string, fromName?: string): string {
    // If fromName is provided and not empty, use it
    if (fromName) {
        return fromName;
    }

    // Otherwise extract from email string format (Name <email@example.com>)
    const namePart = emailString?.split("<")?.[0]?.trim();
    // Remove quotes if present
    if (namePart?.startsWith('"') && namePart?.endsWith('"')) {
        return namePart.substring(1, namePart.length - 1);
    }
    return namePart || emailString || "Unknown";
}

/**
 * Get initials from a name for avatar display
 */
export function getInitials(name: string): string {
    const parts = name.split(" ");
    if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

/**
 * Format date for display with context awareness
 * Ensures the input is a valid Date before formatting
 */
export function formatDate(dateInput: any): string {
    // Ensure we have a valid Date object
    let date: Date;

    try {
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === "string") {
            date = new Date(dateInput);
        } else if (typeof dateInput === "number") {
            date = new Date(dateInput);
        } else {
            // If null, undefined, or other invalid type, use current date
            date = new Date();
        }

        // Verify we have a valid date - if not, use current date
        if (Number.isNaN(date.getTime())) {
            date = new Date();
        }

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === now.toDateString()) {
            // Today, show time only
            return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
        }

        if (date.toDateString() === yesterday.toDateString()) {
            // Yesterday
            return "Yesterday";
        }

        if (now.getFullYear() === date.getFullYear()) {
            // Same year, show month and day
            return date.toLocaleDateString([], { month: "short", day: "numeric" });
        }

        // Different year, show with year
        return date.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
    } catch (error) {
        console.error("Error formatting date:", error);
        return "Invalid date";
    }
}
