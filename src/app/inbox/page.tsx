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
import { useState, useCallback, useEffect, useRef, Suspense } from "react";
import { useUser } from "@/libs/auth/client";
import { redirect, useRouter } from "next/navigation";
import { createParser, useQueryState } from "nuqs";
import { ComposeEmail } from "./components/ComposeEmail";

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

// Use string parser for pageToken with undefined default
const stringParser = createParser({
    parse: String,
    serialize: String,
});

function InboxPage() {
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
    const [pageTokenState, setPageTokenState] = useQueryState('pageToken', stringParser);
    
    // Derived pageToken value - convert empty string to null
    const pageToken = pageTokenState || null;

    // Local state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const debouncedSearchQuery = useDebounce(searchQuery, 300);
    const hasSyncedRef = useRef(false);

    // Hooks
    const queryClient = useQueryClient();
    const { addToast } = useToast();
    const isAuthenticated = !!user && !isAuthLoading;

    // Initialize state for compose email dialog
    const [isComposingEmail, setIsComposingEmail] = useState(false);
    const [replyTo, setReplyTo] = useState<Email | null>(null);
    const [forwardFrom, setForwardFrom] = useState<Email | null>(null);

    // Redirect to login if not authenticated
    useEffect(() => {
        if (!isAuthLoading && !user) {
            router.push("/login");
        }
    }, [user, isAuthLoading, router]);

    // Only fetch emails if user is authenticated
    const { emails, totalPages, totalCount, nextPageToken, isLoading, isFetching } = useInboxData({
        page,
        pageSize,
        searchQuery: debouncedSearchQuery,
        category: currentCategory,
        pageToken,
        enabled: isAuthenticated,
    });

    // Determine if there are more pages available based on nextPageToken
    const hasMorePages = !!nextPageToken;

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
        // If we're moving forward and have a nextPageToken, use it
        if (newPage > page && nextPageToken) {
            setPageTokenState(nextPageToken);
        } else if (newPage < page) {
            // If going back, reset token and use offset-based pagination
            setPageTokenState(null);
            // If skipping back multiple pages, just go back to page 1 and re-fetch
            if (newPage < page - 1) {
                setPage(1);
                setTimeout(() => setPage(newPage), 100);
                return;
            }
        } else if (newPage > page + 1) {
            // Skipping ahead multiple pages not supported with token-based pagination
            // Just go to the next page
            setPage(page + 1);
            return;
        }
        setPage(newPage);
    }, [setPage, setPageTokenState, page, nextPageToken]);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPage(1);
    }, [setPageSize, setPage]);

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

    const handleNewEmail = useCallback(() => {
        setIsComposingEmail(true);
        setReplyTo(null);
        setForwardFrom(null);
    }, []);

    const handleReply = useCallback((email: Email) => {
        setReplyTo(email);
        setForwardFrom(null);
        setIsComposingEmail(true);
    }, []);

    const handleForward = useCallback((email: Email) => {
        setForwardFrom(email);
        setReplyTo(null);
        setIsComposingEmail(true);
    }, []);

    const handleCloseCompose = useCallback(() => {
        setIsComposingEmail(false);
        setReplyTo(null);
        setForwardFrom(null);
    }, []);

    const handleEmailSent = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["emails"] });
    }, [queryClient]);

    // Create initial values for compose email
    const getComposeEmailProps = useCallback(() => {
        // For reply
        if (replyTo) {
            const subject = (replyTo.subject || "").startsWith("Re:") 
                ? (replyTo.subject || "") 
                : `Re: ${replyTo.subject || ""}`;
            
            const originalSender = replyTo.from || "";
            
            // Format reply body with original message
            const replyBody = `
                <br/><br/>
                <div style="padding-left: 20px; border-left: 3px solid #e0e0e0;">
                    <p>On ${new Date(replyTo.createdAt || new Date()).toLocaleString()}, ${originalSender} wrote:</p>
                    <div>${replyTo.body || ""}</div>
                </div>
            `;
            
            return {
                initialTo: originalSender,
                initialSubject: subject,
                initialBody: replyBody,
                threadId: replyTo.threadId
            };
        }
        
        // For forward
        if (forwardFrom) {
            const subject = (forwardFrom.subject || "").startsWith("Fwd:") 
                ? (forwardFrom.subject || "") 
                : `Fwd: ${forwardFrom.subject || ""}`;
            
            // Format forward body with original message
            const forwardBody = `
                <br/><br/>
                <div style="padding: 10px; border-top: 1px solid #e0e0e0;">
                    <p>---------- Forwarded message ---------</p>
                    <p>From: ${forwardFrom.from || ""}</p>
                    <p>Date: ${new Date(forwardFrom.createdAt || new Date()).toLocaleString()}</p>
                    <p>Subject: ${forwardFrom.subject || ""}</p>
                    <p>To: ${forwardFrom.to || ""}</p>
                    <div>${forwardFrom.body || ""}</div>
                </div>
            `;
            
            return {
                initialTo: "",
                initialSubject: subject,
                initialBody: forwardBody,
                threadId: undefined // Start a new thread for forwards
            };
        }
        
        // Default for new email
        return {
            initialTo: "",
            initialSubject: "",
            initialBody: "",
            threadId: undefined
        };
    }, [replyTo, forwardFrom]);

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
                    onAISearch={handleAISearch}
                    onClearAISearch={handleClearAISearch}
                    isAISearchActive={isAISearchActive}
                    isAISearchLoading={isAISearchLoading}
                    currentCategory={currentCategory}
                    categoryOptions={CATEGORY_OPTIONS}
                    onCategoryChange={handleCategoryChange}
                    onNewEmail={handleNewEmail}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                />

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
                        totalCount={displayTotalCount}
                        hasMore={hasMorePages}
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
                    style={{
                        width: "50%",
                        transition: "width 0.3s ease",
                    }}
                >
                    <EmailDetail
                        email={selectedEmail}
                        onClose={() => setSelectedEmail(null)}
                        onToggleStar={handleToggleStar}
                        onReply={handleReply}
                        onForward={handleForward}
                    />
                </Column>
            )}

            {isComposingEmail && (
                <ComposeEmail
                    {...getComposeEmailProps()}
                    onClose={handleCloseCompose}
                    onSuccess={handleEmailSent}
                />
            )}
        </Row>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <InboxPage />
        </Suspense>
    )
}