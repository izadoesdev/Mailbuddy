import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { InboxResponse, Email } from "../types";
import { useToast } from "@/once-ui/components";
import { useEffect, useRef } from "react";

interface FetchEmailsParams {
    page: number;
    pageSize: number;
    threadView: boolean;
    searchQuery?: string;
    enabled?: boolean;
}

/**
 * Fetches emails from the API
 */
const fetchEmails = async ({
    page,
    pageSize,
    threadView,
    searchQuery,
}: Omit<FetchEmailsParams, 'enabled'>): Promise<InboxResponse> => {
    try {
        const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
        const response = await fetch(
            `/api/inbox?page=${page}&pageSize=${pageSize}&threadView=${threadView}${searchParam}`,
        );

        // Special case: If we get a 404, it might just mean no emails yet
        // We'll return an empty inbox rather than throwing an error
        if (response.status === 404) {
            return {
                emails: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false
            };
        }

        // For any other non-ok response, return empty inbox for first load
        // This prevents errors when the user hasn't synced yet
        if (!response.ok) {
            console.warn(`API returned status ${response.status} when fetching emails`);
            return {
                emails: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false
            };
        }

        const data = await response.json();
        if (!data || !Array.isArray(data.emails)) {
            console.warn("Invalid response format from API");
            return {
                emails: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false
            };
        }

        // Process emails to ensure dates are correctly formatted
        data.emails = data.emails.map((email: Email) => ({
            ...email,
            createdAt: email.internalDate
                ? new Date(Number.parseInt(email.internalDate))
                : new Date(email.createdAt),
        }));

        return data;
    } catch (error) {
        console.warn("Error in fetchEmails:", error);
        // Return empty inbox instead of throwing
        return {
            emails: [],
            totalCount: 0,
            page,
            pageSize,
            hasMore: false
        };
    }
};

/**
 * Hook for fetching and managing inbox data
 */
export function useInboxData({ page, pageSize, threadView, searchQuery, enabled = true }: FetchEmailsParams) {
    const { addToast } = useToast();
    const hasShownErrorToast = useRef(false);
    const isFirstLoad = useRef(true);

    // Define the query options
    const queryOptions: UseQueryOptions<InboxResponse, Error> = {
        queryKey: ["emails", page, pageSize, threadView, searchQuery],
        queryFn: () => fetchEmails({ page, pageSize, threadView, searchQuery }),
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
        emails: data?.emails || [],
        totalPages: data ? Math.ceil(data.totalCount / data.pageSize) || 1 : 1,
        totalCount: data?.totalCount || 0,
        isLoading,
        isFetching,
        isError,
        error,
        queryResult, // Allow access to the full query result if needed
    };
}
