"use client";

import type { Email, GmailLabel } from "./types";
import { Row, Column, useToast, Text, Button } from "@/once-ui/components";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { InboxControls } from "./components/InboxControls";
import { Pagination } from "./components/Pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./hooks/useDebounce";
import { useInboxData } from "./hooks/useInboxData";
import { useEmailMutations } from "./hooks/useEmailMutations";
import { useBackgroundSync } from "./hooks/useBackgroundSync";
import { useAISearch } from "./hooks/useAISearch";
import { useState, useCallback, useEffect, useRef } from "react";
import { useUser } from "@/libs/auth/client";
import { redirect, useRouter } from "next/navigation";
import { createParser, useQueryState } from "nuqs";

type CategoryOption = {
    value: string;
    label: string;
};

const CATEGORY_OPTIONS: CategoryOption[] = [
    { value: "inbox", label: "Inbox" },
    { value: "important", label: "Important" },
    { value: "starred", label: "Starred" },
    { value: "sent", label: "Sent" },
    { value: "social", label: "Social" },
    { value: "promotions", label: "Promotions" },
    { value: "updates", label: "Updates" },
    { value: "forums", label: "Forums" }
];

// Create parsers for the URL query parameters
const numberParser = createParser({
    parse: Number,
    serialize: String,
}).withDefault(1);

const pageSizeParser = createParser({
    parse: Number,
    serialize: String,
}).withDefault(20);

export default function InboxPage() {
    // Authentication check
    const router = useRouter();
    const { user, isLoading: isAuthLoading } = useUser();

    if (!isAuthLoading && !user) {
        redirect("/login");
    }

    // URL state with nuqs
    const [page, setPage] = useQueryState('page', numberParser);
    const [pageSize, setPageSize] = useQueryState('pageSize', pageSizeParser);
    const [currentCategory, setCurrentCategory] = useQueryState('category', { 
        defaultValue: 'inbox',
        history: 'replace'
    });

    // Local state
    const [searchQuery, setSearchQuery] = useState("");
    const [threadView, setThreadView] = useState(true);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const hasSyncedRef = useRef(false);

    // Hooks
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const isAuthenticated = !!user && !isAuthLoading;

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/login");
        }
    }, [user, isAuthLoading, router]);

    // Only fetch emails if user is authenticated
    const { emails, totalPages, totalCount, isLoading, isFetching } = useInboxData({
        page,
        pageSize,
        threadView,
        searchQuery: debouncedSearchQuery,
        category: currentCategory,
        enabled: isAuthenticated,
    });

    // Use AI search hook
    const { similarEmails, isAISearchActive, isAISearchLoading, performAISearch, clearAISearch } =
        useAISearch();

    // Pass authentication state to hooks
    const { markAsRead, toggleStar } = useEmailMutations({ enabled: isAuthenticated });
    const { triggerSync, isSyncing } = useBackgroundSync({ enabled: isAuthenticated });

    // Trigger a sync when the inbox is first loaded, but only once
    useEffect(() => {
        // Only trigger on first render, when authenticated, and not already synced
        if (isAuthenticated && !hasSyncedRef.current && !isLoading && !isFetching) {
            hasSyncedRef.current = true; // Mark as synced to prevent future attempts
            triggerSync();
        }
    }, [isAuthenticated, isLoading, isFetching, triggerSync]);

    // Handle email selection
    const handleEmailSelect = useCallback(
        (email: Email) => {
            setSelectedEmail((prev) => (prev?.id === email.id ? null : email));
            if (!email.isRead) {
                markAsRead.mutate(email.id);
            }
        },
        [markAsRead],
    );

    // Toggle star status
    const handleToggleStar = useCallback(
        (email: Email, e: React.MouseEvent<HTMLButtonElement>) => {
            e.stopPropagation();
            toggleStar.mutate({
                emailId: email.id,
                isStarred: !email.isStarred,
            });
        },
        [toggleStar],
    );

    // Handle search
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        setPage(1); // Reset to first page on new search
    }, [setPage]);

    // Handle AI search
    const handleAISearch = useCallback(
        (query: string) => {
            performAISearch(query);
            // No need to update page since we're showing a different view
        },
        [performAISearch],
    );

    // Handle clear AI search
    const handleClearAISearch = useCallback(() => {
        clearAISearch();
    }, [clearAISearch]);

    // Handle page change
    const handlePageChange = useCallback((newPage: number) => {
        setPage(newPage);
    }, [setPage]);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPage(1);
    }, [setPageSize, setPage]);

    // Toggle thread view
    const handleThreadViewChange = useCallback(() => {
        setThreadView((prev) => !prev);
        setPage(1);
    }, [setPage]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["emails"] });
    }, [queryClient]);

    // Handle sync
    const handleSync = useCallback(() => {
        triggerSync();
    }, [triggerSync]);

    // Handle category change
    const handleCategoryChange = useCallback((category: string) => {
        setCurrentCategory(category);
        setPage(1);
    }, [setCurrentCategory, setPage]);

    // Calculate width for main content
    const mainContentWidth = selectedEmail ? "50%" : "100%";

    // Determine which emails to display based on AI search status
    const displayEmails = isAISearchActive ? similarEmails : emails;
    const displayTotalCount = isAISearchActive ? similarEmails.length : totalCount;

    // Conditional rendering logic
    if (isAuthLoading) {
        return (
            <Column fill paddingY="20" horizontal="center" vertical="center">
                <Text variant="heading-default-l">Loading...</Text>
            </Column>
        );
    }

    if (!user) {
        return null;
    }

    return (
        <Row fill padding="8" gap="32">
            <Column
                fillWidth
                style={{
                    width: mainContentWidth,
                    transition: "width 0.3s ease",
                }}
            >
                <InboxControls
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    isLoading={isLoading}
                    isFetching={isFetching}
                    onRefresh={handleRefresh}
                    onSync={handleSync}
                    isSyncing={isSyncing}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                    onAISearch={handleAISearch}
                    onClearAISearch={handleClearAISearch}
                    isAISearchActive={isAISearchActive}
                    isAISearchLoading={isAISearchLoading}
                />

                <Row marginY="16" gap="8" wrap>
                    {CATEGORY_OPTIONS.map((option) => (
                        <Button
                            key={option.value}
                            variant={currentCategory === option.value ? "primary" : "secondary"}
                            onClick={() => handleCategoryChange(option.value)}
                        >
                            {option.label}
                        </Button>
                    ))}
                </Row>

                <Column fill overflow="hidden">
                    <EmailList
                        emails={displayEmails}
                        isLoading={isAISearchActive ? isAISearchLoading : isLoading}
                        selectedEmailId={selectedEmail?.id || null}
                        searchQuery={debouncedSearchQuery}
                        onSelectEmail={handleEmailSelect}
                        onToggleStar={handleToggleStar}
                    />
                    <Pagination
                        page={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                        isLoading={isLoading}
                        isFetching={isFetching}
                        pageSize={pageSize}
                        totalCount={totalCount}
                    />
                </Column>

                {/* Show a simple count for AI search results */}
                {isAISearchActive && (
                    <Row paddingX="16" marginTop="16" horizontal="center">
                        <Text variant="body-default-m">
                            Found {similarEmails.length} similar emails
                        </Text>
                    </Row>
                )}
            </Column>

            {selectedEmail && (
                <Column
                    fillWidth
                    style={{
                        width: "50%",
                        transition: "width 0.3s ease",
                    }}
                >
                    <EmailDetail email={selectedEmail} onClose={() => setSelectedEmail(null)} />
                </Column>
            )}
        </Row>
    );
}
