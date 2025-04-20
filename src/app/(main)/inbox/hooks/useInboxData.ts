import { useToast } from "@/once-ui/components";
import { type UseQueryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { Email, InboxResponse, Thread } from "../types";

interface FetchEmailsParams {
    page: number;
    pageSize: number;
    searchQuery?: string;
    category?: string;
    enabled?: boolean;
    isStarred?: boolean;
    isUnread?: boolean;
}

// Update InboxResponse type to include error information
interface InboxResponseWithError extends InboxResponse {
    error?: string;
    errorType?: string;
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
    signal,
}: Omit<FetchEmailsParams, "enabled"> & {
    signal?: AbortSignal;
}): Promise<InboxResponseWithError> => {
    try {
        const params = new URLSearchParams();
        params.append("page", page.toString());
        params.append("pageSize", pageSize.toString());

        if (searchQuery) params.append("search", searchQuery);
        if (category) {
            if (category.startsWith("category-")) {
                const aiCategory = category.replace("category-", "");
                params.append("aiCategory", aiCategory);
                console.log(`Using AI category: ${aiCategory}`);
            } else if (category.startsWith("priority-")) {
                const aiPriority = category.replace("priority-", "");
                params.append("aiPriority", aiPriority);
                console.log(`Using AI priority: ${aiPriority}`);
            } else {
                params.append("category", category);
                console.log(`Using standard category: ${category}`);
            }
        }
        if (isStarred !== undefined) params.append("isStarred", isStarred.toString());
        if (isUnread !== undefined) params.append("isUnread", isUnread.toString());

        const response = await fetch(`/api/inbox?${params.toString()}`, { signal });

        // Get the response data
        const data = await response.json();

        // Check if the API returned an error message
        if (data.error) {
            console.warn(`API returned error: ${data.error} (${data.errorType || "unknown"})`);
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
                error: data.error,
                errorType: data.errorType,
            };
        }

        // Special case: If we get a 404, it might just mean no emails yet
        if (response.status === 404) {
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
                error: "No emails found",
                errorType: "not_found",
            };
        }

        // For any other non-ok response, return empty inbox with error
        if (!response.ok) {
            console.warn(`API returned status ${response.status} when fetching emails`);
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
                error: "Failed to load emails",
                errorType: "api_error",
            };
        }

        if (!data || !Array.isArray(data.threads)) {
            console.warn("Invalid response format from API");
            return {
                threads: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
                error: "Invalid response format",
                errorType: "format_error",
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
            error: data.error,
            errorType: data.errorType,
        };
    } catch (error) {
        // Check if this was an abort error from the AbortController
        if (error instanceof DOMException && error.name === "AbortError") {
            // This is an expected error when we abort a request, no need to log it
            console.log("Request was cancelled");
        } else {
            console.warn("Error in fetchEmails:", error);
        }

        // Return empty inbox with error information
        return {
            threads: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false,
            error: error instanceof Error ? error.message : "Unknown error",
            errorType: "client_error",
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
    const abortControllerRef = useRef<AbortController | null>(null);

    // Define the query options
    const queryOptions: UseQueryOptions<InboxResponseWithError, Error> = {
        queryKey: ["inbox", page, pageSize, searchQuery, category, isStarred, isUnread],
        queryFn: ({ signal }) => {
            // Cancel any existing request
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }

            // Create a new AbortController for this request
            if (!signal) {
                abortControllerRef.current = new AbortController();
                signal = abortControllerRef.current.signal;
            }

            return fetchEmails({
                page,
                pageSize,
                searchQuery,
                category,
                isStarred,
                isUnread,
                signal,
            });
        },
        staleTime: 60 * 1000, // 1 minute
        retry: false, // Disable retries to prevent multiple error messages
        enabled, // Only run the query when enabled is true
        // Always start with loading state to prevent "empty inbox" flash
        placeholderData: () => ({
            threads: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false,
        }),
    };

    const queryResult = useQuery<InboxResponseWithError, Error>(queryOptions);

    // Cancel pending requests when component unmounts
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Extract data from query result
    const { data, isLoading, isFetching, isError, error } = queryResult;

    // Handle errors in useEffect, not during render
    useEffect(() => {
        // Skip error handling on first load - empty inbox is not an error
        if (isFirstLoad.current && isError && !isFetching) {
            isFirstLoad.current = false;
            return;
        }

        // Check for API-level errors (those included in the response)
        if (data?.error && !hasShownErrorToast.current && enabled && !isFirstLoad.current) {
            console.warn(`API Error: ${data.error} (${data.errorType || "unknown"})`);
            // Don't show toast for sync-in-progress errors
            if (data.errorType !== "sync_in_progress") {
                addToast({
                    variant: "danger",
                    message: data.error,
                });
                hasShownErrorToast.current = true;
            }
        }
        // Check for network-level errors
        else if (error && !hasShownErrorToast.current && enabled && !isFirstLoad.current) {
            // Don't show error toast for aborted requests
            if (!(error instanceof DOMException && error.name === "AbortError")) {
                console.error("Error fetching emails:", error);
                addToast({
                    variant: "danger",
                    message: "Failed to load emails. Please try again later.",
                });
                hasShownErrorToast.current = true;
            }
        } else if (!error && !data?.error) {
            // Reset the flag when there's no error
            hasShownErrorToast.current = false;
            if (isFirstLoad.current && !isLoading && !isFetching) {
                isFirstLoad.current = false;
            }
        }
    }, [error, data, addToast, enabled, isLoading, isFetching, isError]);

    // Return the data in a more convenient format
    return {
        threads: data?.threads || [],
        emails: data?.threads ? data.threads.flatMap((thread) => thread.emails) : [],
        totalCount: data?.totalCount || 0,
        hasMore: data?.hasMore || false,
        error: data?.error || (error instanceof Error ? error.message : undefined),
        errorType: data?.errorType,
        isLoading,
        isFetching,
        isError,
        queryResult, // Allow access to the full query result if needed
    };
}
