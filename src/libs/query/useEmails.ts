"use client";

import { signOut } from "@/libs/auth/client";
import type { EmailResponse } from "@/libs/types/email";
import type { Email } from "@/libs/types/email";
import { useToast } from "@/once-ui/components";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export function useEmails(pageSize = 50) {
    const router = useRouter();
    const { addToast } = useToast();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const loadMoreRef = useRef<HTMLDivElement | null>(null);

    const {
        data,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = useInfiniteQuery<EmailResponse>({
        queryKey: ["emails", "infinite"],
        initialPageParam: 1,
        queryFn: async ({ pageParam = 1 }) => {
            try {
                // Fetch emails from the server using the API route
                const result = await fetch(
                    `/api/inbox?page=${pageParam}&pageSize=${pageSize}`,
                ).then((res) => res.json());

                // If there's an authentication error, redirect to login
                if (
                    result.error &&
                    (result.error.includes("Authentication failed") ||
                        result.error.includes("Access token not available") ||
                        result.error.includes("User not found"))
                ) {
                    // Show a toast message
                    addToast({
                        variant: "danger",
                        message: "Your session has expired. Please log in again.",
                    });

                    // Sign out the user and redirect to login
                    await signOut();
                    router.push("/login");
                }

                return result;
            } catch (error) {
                console.error("Error fetching emails:", error);
                return {
                    error: "Failed to fetch emails. Please try again later.",
                };
            }
        },
        getNextPageParam: (lastPage, pages) => {
            // If there's an error or no messages, don't fetch more
            if (lastPage.error || !lastPage.messages || lastPage.messages.length === 0) {
                return undefined;
            }

            // If we have stats and we're on the last page, don't fetch more
            if (
                lastPage.stats &&
                lastPage.stats.currentPage !== undefined &&
                lastPage.stats.totalPages !== undefined &&
                lastPage.stats.currentPage >= lastPage.stats.totalPages
            ) {
                return undefined;
            }

            // Otherwise, fetch the next page
            return pages.length + 1;
        },
        refetchOnWindowFocus: false,
        staleTime: 0,
        refetchOnMount: true,
        refetchOnReconnect: true,
    });

    // Set up intersection observer for infinite scrolling
    const handleObserver = useCallback(
        (entries: IntersectionObserverEntry[]) => {
            const [target] = entries;
            if (target.isIntersecting && hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
            }
        },
        [fetchNextPage, hasNextPage, isFetchingNextPage],
    );

    useEffect(() => {
        const element = loadMoreRef.current;
        if (!element) return;

        observerRef.current = new IntersectionObserver(handleObserver, {
            root: null,
            rootMargin: "0px",
            threshold: 0.1,
        });

        observerRef.current.observe(element);

        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, [handleObserver]);

    // Flatten the pages data for easier consumption
    const allEmails = (data?.pages.flatMap((page) => page.messages || []) as Email[]) || [];

    return {
        emails: allEmails,
        isLoading,
        isFetchingNextPage,
        isError,
        error,
        refetch,
        loadMoreRef,
        hasNextPage,
    };
}
