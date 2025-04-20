import { useToast } from "@/once-ui/components";
import { useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Trigger a background sync for the current user
 */
const triggerBackgroundSync = async () => {
    try {
        const response = await fetch("/api/background-sync", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ syncType: "user" }),
        });

        // If we get a 409 Conflict, it means a sync is already in progress
        // We'll treat this as a success to prevent errors in the UI
        if (response.status === 409) {
            return { message: "Sync already in progress" };
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to trigger sync");
        }

        return response.json();
    } catch (error) {
        // If the error is a network error, provide a more user-friendly message
        if (error instanceof Error && error.message.includes("Failed to fetch")) {
            throw new Error("Network error. Please check your connection.");
        }
        throw error;
    }
};

/**
 * Hook for triggering and tracking background sync
 * @param options Configuration options
 * @param options.enabled Whether the mutation is enabled (defaults to true)
 */
export function useBackgroundSync({ enabled = true } = {}) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const syncMutation = useMutation({
        mutationFn: triggerBackgroundSync,
        onSuccess: (data) => {
            // Don't show success toast for "already in progress" syncs
            if (data.message === "Sync already in progress") {
                return;
            }

            // addToast({
            //     variant: "success",
            //     message: "Sync successful. New messages will appear shortly.",
            // });

            // Invalidate the email queries to refresh data
            setTimeout(() => {
                queryClient.invalidateQueries({ queryKey: ["emails"] });
            }, 2000); // Give a little time for the sync to complete
        },
        onError: (error) => {
            console.error("Background sync error:", error);
            addToast({
                variant: "danger",
                message:
                    error instanceof Error
                        ? error.message
                        : "Failed to sync emails. Please try again later.",
            });
        },
        // Prevent retries which can cause multiple error messages
        retry: false,
    });

    // Function to trigger sync only if enabled
    const triggerSync = () => {
        if (enabled && !syncMutation.isPending) {
            syncMutation.mutate();
        }
    };

    return {
        triggerSync,
        isSyncing: syncMutation.isPending,
        syncError: syncMutation.error,
        syncStatus: syncMutation.status,
    };
}
