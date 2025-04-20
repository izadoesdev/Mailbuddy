// Type definitions for the calendar component
export interface CalendarEvent {
    id: string;
    title: string;
    description: string;
    date: Date;
    color: string;
    category: string;
    priority?: "low" | "medium" | "high" | "urgent";
    isDeadline?: boolean;
    isOptional?: boolean;
    emailId?: string; // Reference to the email this event was derived from
    sourceType: "ai" | "user"; // Whether this was AI-detected or user-created
}
