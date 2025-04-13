import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { InboxResponse, Thread, Email } from "../types";
import { useToast } from "@/once-ui/components";
import { useEffect, useRef } from "react";

interface FetchEmailsParams {
    page: number;
    pageSize: number;
    searchQuery?: string;
    category?: string;
    enabled?: boolean;
    isStarred?: boolean;
    isUnread?: boolean;
}

/**
 * Fetches emails from the API
 */
const fetchEmails = async ({
    page,
    pageSize,
    searchQuery,
    category,
    isStarred,
    isUnread,
}: Omit<FetchEmailsParams, "enabled">): Promise<InboxResponse> => {
    try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());
        
        if (searchQuery) params.append("search", searchQuery);
        if (category) params.append("category", category);
        if (isStarred !== undefined) params.append("isStarred", isStarred.toString());
        if (isUnread !== undefined) params.append("isUnread", isUnread.toString());
        
        // Determine if we need to parse category into aiCategory or aiPriority params
        if (category) {
            if (category.startsWith('category-')) {
                const aiCategory = category.replace('category-', '');
                params.append("aiCategory", aiCategory);
            } else if (category.startsWith('priority-')) {
                const aiPriority = category.replace('priority-', '');
                params.append("aiPriority", aiPriority);
            }
        }
        
        const response = await fetch(`/api/inbox?${params.toString()}`);

        // Special case: If we get a 404, it might just mean no emails yet
        // We'll return an empty inbox rather than throwing an error
        if (response.status === 404) {
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
            };
        }

        // For any other non-ok response, return empty inbox for first load
        // This prevents errors when the user hasn't synced yet
        if (!response.ok) {
            console.warn(`API returned status ${response.status} when fetching emails`);
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
            };
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.threads)) {
            console.warn("Invalid response format from API");
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
            };
        }

        // Process threads to ensure dates are correctly formatted
        data.threads = data.threads.map((thread: Thread) => {
            // Format thread dates
            const formattedThread = {
                ...thread,
                createdAt: thread.internalDate
                    ? new Date(Number.parseInt(thread.internalDate))
                    : new Date(),
            };
            
            // Format dates for all emails in the thread
            if (thread.emails && Array.isArray(thread.emails)) {
                formattedThread.emails = thread.emails.map((email: Email) => ({
                    ...email,
                    createdAt: email.internalDate
                        ? new Date(Number.parseInt(email.internalDate))
                        : new Date(email.createdAt),
                }));
            }
            
            return formattedThread;
        });

        return {
            threads: data.threads,
            totalCount: data.totalCount || 0,
            page: data.page || page,
            pageSize: data.pageSize || pageSize,
            hasMore: data.hasMore || false,
        };
    } catch (error) {
        console.warn("Error in fetchEmails:", error);
        // Return empty inbox instead of throwing
        return {
            threads: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false,
        };
    }
};

/**
 * Hook for fetching and managing inbox data
 */
export function useInboxData({
    page,
    pageSize,
    searchQuery,
    category,
    enabled = true,
    isStarred,
    isUnread,
}: FetchEmailsParams) {
    const { addToast } = useToast();
    const hasShownErrorToast = useRef(false);
    const isFirstLoad = useRef(true);

    // Define the query options
    const queryOptions: UseQueryOptions<InboxResponse, Error> = {
        queryKey: ["inbox", page, pageSize, searchQuery, category, isStarred, isUnread],
        queryFn: () => fetchEmails({ page, pageSize, searchQuery, category, isStarred, isUnread }),
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Disable retries to prevent multiple error messages
        enabled, // Only run the query when enabled is true
    };

    const queryResult = useQuery<InboxResponse, Error>(queryOptions);

    // Extract data from query result
    const { data, isLoading, isFetching, isError, error } = queryResult;

    // Handle errors in useEffect, not during render
    useEffect(() => {
        // Skip error handling on first load - empty inbox is not an error
        if (isFirstLoad.current && isError && !isFetching) {
            isFirstLoad.current = false;
            return;
        }

        if (error && !hasShownErrorToast.current && enabled && !isFirstLoad.current) {
            console.error("Error fetching emails:", error);
            addToast({
                variant: "danger",
                message: "Failed to load emails. Please try again later.",
            });
            hasShownErrorToast.current = true;
        } else if (!error) {
            // Reset the flag when there's no error
            hasShownErrorToast.current = false;
            if (isFirstLoad.current && !isLoading && !isFetching) {
                isFirstLoad.current = false;
            }
        }
    }, [error, addToast, enabled, isLoading, isFetching, isError]);

    // Return the data in a more convenient format
    return {
        threads: data?.threads || [],
        emails: data?.threads ? data.threads.flatMap(thread => thread.emails) : [],
        totalCount: data?.totalCount || 0,
        hasMore: data?.hasMore || false,
        isLoading,
        isFetching,
        isError,
        error,
        queryResult, // Allow access to the full query result if needed
    };
}
