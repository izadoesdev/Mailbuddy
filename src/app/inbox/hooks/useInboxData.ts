import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import type { InboxResponse, Email } from "../types";
import { useToast } from "@/once-ui/components";

interface FetchEmailsParams {
    page: number;
    pageSize: number;
    threadView: boolean;
    searchQuery?: string;
}

/**
 * Fetches emails from the API
 */
const fetchEmails = async ({
    page,
    pageSize,
    threadView,
    searchQuery,
}: FetchEmailsParams): Promise<InboxResponse> => {
    const searchParam = searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : "";
    const response = await fetch(
        `/api/inbox?page=${page}&pageSize=${pageSize}&threadView=${threadView}${searchParam}`,
    );

    if (!response.ok) throw new Error("Failed to fetch emails");

    const data = await response.json();
    if (!data || !Array.isArray(data.emails)) {
        throw new Error("Invalid response format");
    }

    // Process emails to ensure dates are correctly formatted
    data.emails = data.emails.map((email: Email) => ({
        ...email,
        createdAt: email.internalDate
            ? new Date(Number.parseInt(email.internalDate))
            : new Date(email.createdAt),
    }));

    return data;
};

/**
 * Hook for fetching and managing inbox data
 */
export function useInboxData({ page, pageSize, threadView, searchQuery }: FetchEmailsParams) {
    const { addToast } = useToast();

    // Define the query options
    const queryOptions: UseQueryOptions<InboxResponse, Error> = {
        queryKey: ["emails", page, pageSize, threadView, searchQuery],
        queryFn: () => fetchEmails({ page, pageSize, threadView, searchQuery }),
        staleTime: 60 * 1000, // 1 minute
    };

    const queryResult = useQuery<InboxResponse, Error>(queryOptions);

    // Handle errors outside the query definition
    if (queryResult.error) {
        console.error("Error fetching emails:", queryResult.error);
        addToast({
            variant: "danger",
            message: "Failed to load emails. Please try again later.",
        });
    }

    // Extract and return the data in a more convenient format
    const { data, isLoading, isFetching, isError, error } = queryResult;

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
