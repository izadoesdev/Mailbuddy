/**
 * Extract name from email address string
 */
export function extractName(emailString: string): string {
  const namePart = emailString?.split('<')[0].trim();
  return namePart || emailString || 'Unknown';
}

/**
 * Get initials from a name for avatar display
 */
export function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Format date for display with context awareness
 */
export function formatDate(date: Date): string {
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === now.toDateString()) {
    // Today, show time only
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } else if (date.toDateString() === yesterday.toDateString()) {
    // Yesterday
    return 'Yesterday';
  } else if (now.getFullYear() === date.getFullYear()) {
    // Same year, show month and day
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  } else {
    // Different year, show with year
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
} 