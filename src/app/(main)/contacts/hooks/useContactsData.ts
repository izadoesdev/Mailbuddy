import { useQuery } from "@tanstack/react-query";
import { useRef } from "react";
import type { Contact, ContactsQueryParams, ContactsResponse } from "../types";

/**
 * Fetches contacts from the API
 */
async function fetchContacts(
    params: ContactsQueryParams,
    signal?: AbortSignal,
): Promise<ContactsResponse> {
    // Build query string
    const queryParams = new URLSearchParams();

    // Add all available parameters
    if (params.page) queryParams.append("page", String(params.page));
    if (params.pageSize) queryParams.append("pageSize", String(params.pageSize));
    if (params.sortBy) queryParams.append("sortBy", params.sortBy);
    if (params.sortOrder) queryParams.append("sortOrder", params.sortOrder);
    if (params.category) queryParams.append("category", params.category);
    if (params.priority) queryParams.append("priority", params.priority);
    if (params.query) queryParams.append("query", params.query);

    try {
        // Fetch from the API with timeout
        const response = await fetch(`/api/contacts?${queryParams.toString()}`, {
            signal,
        });

        // If response is not ok, throw an error
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            throw new Error(errorData.error || `Failed to fetch contacts: ${response.status}`);
        }

        // Parse and return the response
        const data = await response.json();

        // Format dates properly
        return {
            ...data,
            contacts:
                data.contacts?.map((contact: Contact) => ({
                    ...contact,
                    latestEmailDate: contact.latestEmailDate
                        ? new Date(contact.latestEmailDate)
                        : null,
                })) || [],
        };
    } catch (error) {
        // Handle abort errors differently to prevent retries
        if (error instanceof DOMException && error.name === "AbortError") {
            throw new Error("Request timeout: The server took too long to respond");
        }
        throw error;
    }
}

/**
 * Hook for fetching and managing contacts data
 */
export function useContactsData(params: ContactsQueryParams = {}) {
    // Use a ref to track if we've already shown an error for the current request
    const errorShownRef = useRef(false);
    // Track the current query keys to detect changes
    const queryKeyRef = useRef<any[]>(["contacts", {}]);

    const { page = 1, pageSize = 20, sortBy = "emailCount", sortOrder = "desc" } = params;

    // Define query key that includes all parameters
    const queryKey = ["contacts", { ...params }];

    // Reset error shown flag when query key changes
    if (JSON.stringify(queryKeyRef.current) !== JSON.stringify(queryKey)) {
        errorShownRef.current = false;
        queryKeyRef.current = queryKey;
    }

    // Use react-query for data fetching with caching
    const { data, isLoading, isError, error, refetch, isFetching, failureCount, status } = useQuery<
        ContactsResponse,
        Error
    >({
        queryKey,
        queryFn: ({ signal }) => fetchContacts(params, signal),
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => {
            // Only retry once for most errors, never for timeouts
            if (error.message.includes("timeout") || failureCount >= 1) {
                return false;
            }
            return true;
        },
        retryDelay: 2000, // Fixed 2 second delay between retries
        gcTime: 10 * 60 * 1000, // 10 minutes
    });

    // Determine if we should show an error toast
    const shouldShowErrorToast = isError && !errorShownRef.current && status === "error";

    // If we should show an error toast, mark that we've shown it
    if (shouldShowErrorToast) {
        errorShownRef.current = true;
    }

    // Return data and status with safe fallbacks
    return {
        contacts: data?.contacts || [],
        totalCount: data?.totalCount || 0,
        hasMore: data?.hasMore || false,
        page: data?.page || page,
        pageSize: data?.pageSize || pageSize,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        errorMessage: error?.message || null,
        shouldShowErrorToast,
        failureCount,
    };
}
