"use server";

import { prisma } from "@/libs/db";
import type { CalendarEvent } from "./types";

/**
 * Get upcoming events from AI metadata (deadlines, meetings, etc.)
 */
export async function getUpcomingEvents(userId: string) {
    try {
        // First, get emails with deadlines
        const emailsWithDeadlines = await prisma.emailAIMetadata.findMany({
            where: {
                email: {
                    userId: userId,
                },
                hasDeadline: true,
                // Only get future deadlines
                nextDeadline: {
                    gte: new Date(),
                },
            },
            orderBy: {
                nextDeadline: "asc",
            },
            include: {
                email: {
                    select: {
                        id: true,
                        subject: true,
                        snippet: true,
                        from: true,
                    },
                },
            },
            take: 50,
        });

        // Convert deadline emails to calendar events
        const deadlineEvents = emailsWithDeadlines.map((metadata) => {
            // Get priority level from metadata
            let priority = "medium";
            if (metadata.priority === "Urgent") priority = "urgent";
            else if (metadata.priority === "High") priority = "high";
            else if (metadata.priority === "Low") priority = "low";

            // Get a meaningful title from deadlines or email subject
            let title = metadata.email.subject || "Deadline";
            let description = metadata.summary || metadata.email.snippet || "";
            let date = metadata.nextDeadline || new Date();

            // Look for more specific deadline info in the structured data
            if (metadata.deadlines && typeof metadata.deadlines === "object") {
                const deadlineEntries = Object.entries(metadata.deadlines as Record<string, any>);
                if (deadlineEntries.length > 0) {
                    const [_, firstDeadline] = deadlineEntries[0];
                    if (firstDeadline && typeof firstDeadline === "object") {
                        if (firstDeadline.event && typeof firstDeadline.event === "string") {
                            title = firstDeadline.event;
                        }
                        if (
                            firstDeadline.description &&
                            typeof firstDeadline.description === "string"
                        ) {
                            description = firstDeadline.description;
                        }
                        if (firstDeadline.date && typeof firstDeadline.date === "string") {
                            try {
                                date = new Date(firstDeadline.date);
                            } catch (e) {
                                // Keep the nextDeadline value if parsing fails
                            }
                        }
                    }
                }
            }

            // Determine category based on metadata
            let category = "work";
            if (metadata.category) {
                const lowerCategory = metadata.category.toLowerCase();
                if (lowerCategory.includes("personal") || lowerCategory.includes("social")) {
                    category = "personal";
                } else if (lowerCategory.includes("work") || lowerCategory.includes("job")) {
                    category = "work";
                }
            }

            // Determine color based on priority/category
            let color = "brand";
            if (priority === "urgent" || priority === "high") {
                color = "danger";
            } else if (category === "personal") {
                color = "success";
            }

            return {
                id: `ai-${metadata.id}`,
                title,
                description,
                date,
                color,
                category,
                priority: priority as "low" | "medium" | "high" | "urgent",
                isDeadline: true,
                isOptional: false,
                emailId: metadata.emailId,
                sourceType: "ai" as const,
            };
        });

        // Get user-created events from the database
        // TODO: Implement proper events table in the database

        return { success: true, events: deadlineEvents };
    } catch (error) {
        console.error("Error fetching upcoming events:", error);
        return { success: false, error: String(error), events: [] };
    }
}

/**
 * Add a calendar event (user-created)
 */
export async function addCalendarEvent(userId: string, event: Omit<CalendarEvent, "id">) {
    try {
        // For now, we're just returning a mock response since we don't have
        // a proper events table yet
        return {
            success: true,
            event: {
                ...event,
                id: `user-${Date.now()}`,
                sourceType: "user" as const,
            },
        };
    } catch (error) {
        console.error("Error adding calendar event:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Delete a calendar event
 */
export async function deleteCalendarEvent(userId: string, eventId: string) {
    try {
        // For now, we're just returning a mock response since we don't have
        // a proper events table yet
        return { success: true };
    } catch (error) {
        console.error("Error deleting calendar event:", error);
        return { success: false, error: String(error) };
    }
}
