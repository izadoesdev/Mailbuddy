import { useQuery } from "@tanstack/react-query";
import type { Email } from "../types";

/**
 * Hook to fetch a single email by ID
 * @param emailId The ID of the email to fetch
 * @param options Additional options
 */
export function useEmail(emailId: string, { enabled = true } = {}) {
    return useQuery({
        queryKey: ["email", emailId],
        queryFn: async () => {
            if (!emailId) {
                throw new Error("Email ID is required");
            }

            try {
                console.log(`Fetching email with ID: ${emailId}`);
                const response = await fetch(`/api/inbox/email/${emailId}`);

                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    console.error(`Error response from API: ${response.status}`, errorData);
                    throw new Error(errorData.error || `Failed to fetch email: ${response.status}`);
                }

                const data = await response.json();
                console.log("Email data received:", data);

                // If for some reason the data is an array (the old API format), take the first item
                const emailData = Array.isArray(data) ? data[0] : data;

                if (!emailData) {
                    console.error("No email data found in response");
                    throw new Error("Email not found in response");
                }

                // Process dates
                if (emailData.internalDate) {
                    emailData.createdAt = new Date(Number.parseInt(emailData.internalDate));
                } else if (emailData.createdAt) {
                    emailData.createdAt = new Date(emailData.createdAt);
                }

                return emailData as Email;
            } catch (error) {
                console.error("Error fetching email:", error);
                throw error;
            }
        },
        enabled: enabled && !!emailId,
        // Add more fine-tuned options
        retry: 2,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
    });
}
