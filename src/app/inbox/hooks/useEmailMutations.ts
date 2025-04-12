import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Email } from "@/libs/types/email";

interface ToggleStarParams {
    emailId: string;
    isStarred: boolean;
}

/**
 * Hook for email-related mutations (mark as read, toggle star)
 * @param options Configuration options
 * @param options.enabled Whether the mutations are enabled (defaults to true)
 */
export function useEmailMutations({ enabled = true } = {}) {
    const queryClient = useQueryClient();

    // Mark email as read mutation
    const markAsRead = useMutation<string, Error, string>({
        mutationFn: async (emailId: string) => {
            const response = await fetch(`/api/emails/${emailId}/read`, {
                method: "PUT",
            });

            if (!response.ok) throw new Error("Failed to mark email as read");
            return emailId;
        },
        onSuccess: (emailId, _, context) => {
            // Update email cache for all queries
            // queryClient.invalidateQueries({ queryKey: ["emails"] });

            // Optimistic update for immediate UI feedback
            const queries = queryClient.getQueriesData({ queryKey: ["emails"] });

            for (const [queryKey, queryData] of queries) {
                if (queryData && typeof queryData === "object" && "emails" in queryData) {
                    const data = queryData as { emails: Email[] };

                    queryClient.setQueryData(queryKey, {
                        ...queryData,
                        emails: data.emails.map((email) =>
                            email.id === emailId ? { ...email, isRead: true } : email,
                        ),
                    });
                }
            }
        },
    });

    // Toggle star mutation
    const toggleStar = useMutation<ToggleStarParams, Error, ToggleStarParams>({
        mutationFn: async ({ emailId, isStarred }: ToggleStarParams) => {
            const response = await fetch(`/api/emails/${emailId}/star`, {
                method: "PUT",
                body: JSON.stringify({ isStarred }),
            });

            if (!response.ok) throw new Error("Failed to update star status");
            return { emailId, isStarred };
        },
        onSuccess: ({ emailId, isStarred }, _, context) => {
            // Update email cache for all queries
            // queryClient.invalidateQueries({ queryKey: ["emails"] });

            // Optimistic update for immediate UI feedback
            const queries = queryClient.getQueriesData({ queryKey: ["emails"] });

            for (const [queryKey, queryData] of queries) {
                if (queryData && typeof queryData === "object" && "emails" in queryData) {
                    const data = queryData as { emails: Email[] };

                    queryClient.setQueryData(queryKey, {
                        ...queryData,
                        emails: data.emails.map((email) =>
                            email.id === emailId ? { ...email, isStarred } : email,
                        ),
                    });
                }
            }
        },
    });

    // Wrapper functions that respect the enabled flag
    const safeMarkAsRead = {
        ...markAsRead,
        mutate: (emailId: string) => {
            if (enabled) {
                markAsRead.mutate(emailId);
            }
        },
        mutateAsync: async (emailId: string) => {
            if (enabled) {
                return await markAsRead.mutateAsync(emailId);
            }
            return emailId;
        },
    };

    const safeToggleStar = {
        ...toggleStar,
        mutate: (params: ToggleStarParams) => {
            if (enabled) {
                toggleStar.mutate(params);
            }
        },
        mutateAsync: async (params: ToggleStarParams) => {
            if (enabled) {
                return await toggleStar.mutateAsync(params);
            }
            return params;
        },
    };

    return {
        markAsRead: safeMarkAsRead,
        toggleStar: safeToggleStar,
    };
}
