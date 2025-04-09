import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/once-ui/components";

/**
 * Trigger a background sync for the current user
 */
const triggerBackgroundSync = async () => {
    const response = await fetch("/api/background-sync", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ syncType: "user" }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to trigger sync");
    }

    return response.json();
};

/**
 * Hook for triggering and tracking background sync
 */
export function useBackgroundSync() {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    const syncMutation = useMutation({
        mutationFn: triggerBackgroundSync,
        onSuccess: (data) => {
            addToast({
                variant: "success",
                message: "Sync successful. New messages will appear shortly.",
            });

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
    });

    return {
        triggerSync: syncMutation.mutate,
        isSyncing: syncMutation.isPending,
        syncError: syncMutation.error,
        syncStatus: syncMutation.status,
    };
}
