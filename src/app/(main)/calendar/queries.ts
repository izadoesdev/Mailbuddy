"use client";

import { useQuery } from "@tanstack/react-query";

// Query keys for TanStack Query cache management
export const queryKeys = {
    events: () => ["calendar-events"],
    upcomingEvents: () => ["upcoming-events"],
};

// Hook to fetch upcoming events
export function useUpcomingEvents() {
    return useQuery({
        queryKey: queryKeys.upcomingEvents(),
        queryFn: async () => {
            const result = await fetch("/api/calendar/events");
            const data = await result.json();

            // Transform the date strings into Date objects
            if (data.events) {
                return data.events.map((event: any) => ({
                    ...event,
                    date: new Date(event.date),
                }));
            }

            return [];
        },
        staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    });
}

// Utility to map priority levels from AI metadata to calendar event priorities
export function mapPriorityLevel(level?: string): "low" | "medium" | "high" | "urgent" | undefined {
    if (!level) return undefined;

    switch (level.toLowerCase()) {
        case "urgent":
            return "urgent";
        case "high":
            return "high";
        case "medium":
            return "medium";
        case "low":
            return "low";
        default:
            return "medium";
    }
}

// Utility to map email categories to appropriate colors
export function mapCategoryToColor(category?: string): string {
    if (!category) return "brand";

    const lowerCategory = category.toLowerCase();

    if (lowerCategory.includes("work") || lowerCategory.includes("job")) {
        return "brand";
    }

    if (lowerCategory.includes("deadline") || lowerCategory.includes("urgent")) {
        return "danger";
    }

    if (lowerCategory.includes("personal") || lowerCategory.includes("social")) {
        return "success";
    }

    if (lowerCategory.includes("meeting") || lowerCategory.includes("appointment")) {
        return "warning";
    }

    return "brand"; // Default color
}
