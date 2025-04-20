import type { Email } from "@/libs/types/email";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface ToggleStarParams {
    emailId: string;
    isStarred: boolean;
}

interface SendEmailParams {
    to: string;
    cc?: string;
    bcc?: string;
    subject: string;
    body: string;
    threadId?: string;
}

// Create a type for the mutation context
interface MutationContext {
    previousInbox?: any;
}

/**
 * Hook for email-related mutations (mark as read, toggle star)
 * @param options Configuration options
 * @param options.enabled Whether the mutations are enabled (defaults to true)
 */
export function useEmailMutations({ enabled = true } = {}) {
    const queryClient = useQueryClient();

    // Mark email as read mutation
    const markAsRead = useMutation<string, Error, string, MutationContext>({
        mutationFn: async (emailId: string) => {
            const response = await fetch(`/api/emails/${emailId}/read`, {
                method: "PUT",
            });

            if (!response.ok) throw new Error("Failed to mark email as read");
            return emailId;
        },
        onMutate: async (emailId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["inbox"] });

            // Snapshot the previous value
            const previousInbox = queryClient.getQueryData(["inbox"]);

            // Apply optimistic update to the inbox
            queryClient.setQueriesData({ queryKey: ["inbox"] }, (oldData: any) => {
                if (!oldData || !oldData.threads) return oldData;

                return {
                    ...oldData,
                    threads: oldData.threads.map((thread: any) => {
                        // Check if this thread contains the email being marked as read
                        if (thread?.emails?.some((email: any) => email?.id === emailId)) {
                            // Update the email within the thread
                            const updatedEmails = thread.emails.map((email: any) =>
                                email.id === emailId ? { ...email, isRead: true } : email,
                            );

                            // Update the thread's isRead status (thread is considered read if all emails are read)
                            const allEmailsRead = updatedEmails.every((email: any) => email.isRead);

                            return {
                                ...thread,
                                emails: updatedEmails,
                                isRead: allEmailsRead,
                            };
                        }
                        return thread;
                    }),
                };
            });

            // Return a context object with the snapshotted value
            return { previousInbox };
        },
        onError: (err, emailId, context) => {
            // Rollback on error
            if (context?.previousInbox) {
                queryClient.setQueryData(["inbox"], context.previousInbox);
            }
        },
    });

    // Toggle star mutation
    const toggleStar = useMutation<ToggleStarParams, Error, ToggleStarParams, MutationContext>({
        mutationFn: async ({ emailId, isStarred }: ToggleStarParams) => {
            const response = await fetch(`/api/emails/${emailId}/star`, {
                method: "PUT",
                body: JSON.stringify({ isStarred }),
            });

            if (!response.ok) throw new Error("Failed to update star status");
            return { emailId, isStarred };
        },
        onMutate: async ({ emailId, isStarred }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["inbox"] });

            // Snapshot the previous value
            const previousInbox = queryClient.getQueryData(["inbox"]);

            // Apply optimistic update to the inbox
            queryClient.setQueriesData({ queryKey: ["inbox"] }, (oldData: any) => {
                if (!oldData || !oldData.threads) return oldData;

                return {
                    ...oldData,
                    threads: oldData.threads.map((thread: any) => {
                        // Check if this thread contains the email being starred/unstarred
                        if (thread?.emails?.some((email: any) => email?.id === emailId)) {
                            // If this is the first email in the thread (which controls the thread star status)
                            if (thread.emails[0]?.id === emailId) {
                                // Update both the email and thread star status
                                const updatedEmails = thread.emails.map((email: any) =>
                                    email.id === emailId ? { ...email, isStarred } : email,
                                );

                                return {
                                    ...thread,
                                    emails: updatedEmails,
                                    isStarred, // Update thread's star status to match the first email
                                };
                            }

                            // Just update the individual email's star status
                            return {
                                ...thread,
                                emails: thread.emails.map((email: any) =>
                                    email.id === emailId ? { ...email, isStarred } : email,
                                ),
                            };
                        }
                        return thread;
                    }),
                };
            });

            // Return a context object with the snapshotted value
            return { previousInbox };
        },
        onError: (err, vars, context) => {
            // Rollback on error
            if (context?.previousInbox) {
                queryClient.setQueryData(["inbox"], context.previousInbox);
            }
        },
    });

    // Trash email mutation
    const trashEmail = useMutation<string, Error, string, MutationContext>({
        mutationFn: async (emailId: string) => {
            const response = await fetch(`/api/emails/${emailId}/trash`, {
                method: "PUT",
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to move email to trash");
            }
            return emailId;
        },
        onMutate: async (emailId) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: ["inbox"] });

            // Snapshot the previous value
            const previousInbox = queryClient.getQueryData(["inbox"]);

            // Apply optimistic update to the inbox
            queryClient.setQueriesData({ queryKey: ["inbox"] }, (oldData: any) => {
                if (!oldData || !oldData.threads) return oldData;

                // First, find which threads contain this email
                const updatedThreads = oldData.threads
                    .map((thread: any) => {
                        if (!thread?.emails) return thread;

                        // Check if this email is in the thread
                        if (thread.emails.some((email: any) => email?.id === emailId)) {
                            const remainingEmails = thread.emails.filter(
                                (email: any) => email.id !== emailId,
                            );

                            // If this was the only email in the thread, remove the entire thread
                            if (remainingEmails.length === 0) {
                                return null; // Will be filtered out later
                            }

                            // Otherwise, update the thread with remaining emails
                            return {
                                ...thread,
                                emails: remainingEmails,
                                // If the first email was removed, update thread properties from the new first email
                                ...(thread.emails[0]?.id === emailId && remainingEmails.length > 0
                                    ? {
                                          subject: remainingEmails[0].subject,
                                          from: remainingEmails[0].from,
                                          to: remainingEmails[0].to,
                                          snippet: remainingEmails[0].snippet,
                                          isRead: remainingEmails[0].isRead,
                                          isStarred: remainingEmails[0].isStarred,
                                          internalDate: remainingEmails[0].internalDate,
                                          aiMetadata: remainingEmails[0].aiMetadata,
                                      }
                                    : {}),
                                emailCount: remainingEmails.length,
                            };
                        }

                        return thread;
                    })
                    .filter(Boolean); // Remove null entries (threads with no remaining emails)

                return {
                    ...oldData,
                    threads: updatedThreads,
                    totalCount: oldData.totalCount > 0 ? oldData.totalCount - 1 : 0,
                };
            });

            // Return a context with the previous state
            return { previousInbox };
        },
        onError: (err, emailId, context) => {
            // Rollback on error
            if (context?.previousInbox) {
                queryClient.setQueryData(["inbox"], context.previousInbox);
            }

            // Show error message
            queryClient.setQueryData(
                ["toasts"],
                [
                    {
                        id: Date.now().toString(),
                        variant: "danger",
                        message:
                            err instanceof Error ? err.message : "Failed to move email to trash",
                    },
                ],
            );
        },
        onSuccess: () => {
            // Show success message
            queryClient.setQueryData(
                ["toasts"],
                [
                    {
                        id: Date.now().toString(),
                        variant: "success",
                        message: "Email moved to trash",
                    },
                ],
            );
        },
    });

    // Send email mutation
    const sendEmail = useMutation<SendEmailParams, Error, SendEmailParams>({
        mutationFn: async (emailData: SendEmailParams) => {
            const response = await fetch("/api/inbox/send", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(emailData),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || "Failed to send email");
            }
            return emailData;
        },
        onSuccess: (_, __, ___) => {
            // Invalidate emails queries to refresh inbox
            queryClient.invalidateQueries({ queryKey: ["emails"] });
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

    const safeTrashEmail = {
        ...trashEmail,
        mutate: (emailId: string) => {
            if (enabled) {
                trashEmail.mutate(emailId);
            }
        },
        mutateAsync: async (emailId: string) => {
            if (enabled) {
                return await trashEmail.mutateAsync(emailId);
            }
            return emailId;
        },
    };

    const safeSendEmail = {
        ...sendEmail,
        mutate: (params: SendEmailParams) => {
            if (enabled) {
                sendEmail.mutate(params);
            }
        },
        mutateAsync: async (params: SendEmailParams) => {
            if (enabled) {
                return await sendEmail.mutateAsync(params);
            }
            return params;
        },
    };

    return {
        markAsRead: safeMarkAsRead,
        toggleStar: safeToggleStar,
        trashEmail: safeTrashEmail,
        sendEmail: safeSendEmail,
    };
}
