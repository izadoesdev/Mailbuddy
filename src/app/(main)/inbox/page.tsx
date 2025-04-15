"use client";

import type { Email, Thread } from "./types";
import { Row, Column, useToast, Text, Spinner } from "@/once-ui/components";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { InboxControls } from "./components/InboxControls";
import { Pagination } from "./components/Pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./hooks/useDebounce";
import { useInboxData } from "./hooks/useInboxData";
import { useEmailMutations } from "./hooks/useEmailMutations";
import { useBackgroundSync } from "./hooks/useBackgroundSync";
// import { useInitialSync } from "./hooks/useInitialSync";
import { useAISearch } from "./hooks/useAISearch";
import { useState, useCallback, useEffect, useRef, Suspense, useMemo } from "react";
import { authClient, useUser } from "@/libs/auth/client";
import { redirect, useRouter } from "next/navigation";
import { createParser, useQueryState } from "nuqs";
import { ComposeEmail } from "./components/ComposeEmail";
import { SyncOverlay } from "./components/SyncOverlay";
import { EMAIL_CATEGORIES, PRIORITY_LEVELS } from "@/app/(dev)/ai/new/constants";
import { useInitialSync } from "./hooks/useInitialSync";

type CategoryOption = {
    value: string;
    label: string;
    badge?: string;
    color?: string;
    icon?: string;
};

// Standard Gmail categories
const STANDARD_CATEGORIES: CategoryOption[] = [
    { value: "inbox", label: "Inbox", icon: "inbox" },
    { value: "important", label: "Important", icon: "star" },
    { value: "starred", label: "Starred", icon: "starFill" },
    { value: "sent", label: "Sent", icon: "arrowUpRight" }
];

// Create Priority-based categories
const PRIORITY_CATEGORIES: CategoryOption[] = [
    { value: "priority-urgent", label: "Urgent", color: "danger", badge: PRIORITY_LEVELS.URGENT, icon: "errorCircle" },
    { value: "priority-high", label: "High Priority", color: "warning", badge: PRIORITY_LEVELS.HIGH, icon: "warningTriangle" },
    { value: "priority-medium", label: "Medium Priority", color: "info", badge: PRIORITY_LEVELS.MEDIUM, icon: "infoCircle" },
    { value: "priority-low", label: "Low Priority", color: "success", badge: PRIORITY_LEVELS.LOW, icon: "checkCircle" }
];

// Create AI categories from EMAIL_CATEGORIES constant
const AI_CATEGORIES: CategoryOption[] = [
    // Work & Business
    { value: "category-work", label: "Work", icon: "briefcase" },
    { value: "category-job", label: "Job Applications", icon: "briefcase" },
    { value: "category-financial", label: "Financial", icon: "money" },
    { value: "category-legal", label: "Legal", icon: "shield" },
    { value: "category-invoices", label: "Invoices", icon: "clipboard" },
    { value: "category-receipts", label: "Receipts", icon: "clipboard" },
    
    // Personal & Social
    { value: "category-personal", label: "Personal", icon: "person" },
    { value: "category-social", label: "Social", icon: "group" },
    { value: "category-healthcare", label: "Healthcare", icon: "shield" },
    
    // Updates & Marketing
    { value: "category-updates", label: "Updates", icon: "refresh" },
    { value: "category-newsletters", label: "Newsletters", icon: "mail" },
    { value: "category-promotions", label: "Promotions", icon: "tag" },
    { value: "category-marketing", label: "Marketing", icon: "bullhorn" },
    
    // Events & Travel
    { value: "category-events", label: "Events", icon: "calendar" },
    { value: "category-scheduling", label: "Scheduling", icon: "calendar" },
    { value: "category-travel", label: "Travel", icon: "plane" },
    { value: "category-shipping", label: "Shipping", icon: "truck" },
    
    // Other Categories
    { value: "category-support", label: "Support", icon: "helpCircle" },
    { value: "category-alerts", label: "Alerts", icon: "bell" },
    { value: "category-educational", label: "Educational", icon: "book" },
    { value: "category-technology", label: "Technology", icon: "computer" },
    { value: "category-shopping", label: "Shopping", icon: "bag" },
    { value: "category-food", label: "Food", icon: "utensils" },
    { value: "category-entertainment", label: "Entertainment", icon: "music" },
    { value: "category-security", label: "Security", icon: "security" }
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

    // Local state
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedThread, setSelectedThread] = useState<Thread | null>(null);
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
    const { threads, emails, totalCount, isLoading, isFetching, hasMore, error, errorType } = useInboxData({
        page,
        pageSize,
        searchQuery: debouncedSearchQuery,
        category: currentCategory,
        enabled: isAuthenticated,
    });
    
    // Calculate total pages based on totalCount and pageSize
    const totalPages = totalCount ? Math.ceil(totalCount / pageSize) : 1;

    // Combine all category options
    const allCategoryOptions = useMemo(() => {
        return [
            ...STANDARD_CATEGORIES,
            ...PRIORITY_CATEGORIES,
            ...AI_CATEGORIES
        ];
    }, []);

    // Use AI search hook
    const { similarEmails, isAISearchActive, isAISearchLoading, performAISearch, clearAISearch } =
        useAISearch();

    // Pass authentication state to hooks
    const { markAsRead, toggleStar, trashEmail } = useEmailMutations({ enabled: isAuthenticated });
    const { triggerSync, isSyncing } = useBackgroundSync({ enabled: isAuthenticated });
    
    const { 
        syncStatus,
        progress,
        message,
        isInitialSyncInProgress,
        performInitialSync,
        error: syncError,
        errorType: syncErrorType,
        resetSyncError
    } = useInitialSync({ 
        enabled: isAuthenticated,
        redirectAfterSync: false,
    });

    // Memoize the triggerSync function to prevent it from changing on each render
    const memoizedTriggerSync = useCallback(() => {
        triggerSync();
    }, [triggerSync]);

    useEffect(() => {
        // Prevent multiple syncs - only sync if not in error state and not already syncing
        if (isAuthenticated && 
            !hasSyncedRef.current && 
            !isLoading && 
            !isFetching && 
            !isInitialSyncInProgress && 
            syncStatus !== "error") {
            
            hasSyncedRef.current = true; // Mark as synced to prevent future attempts
            memoizedTriggerSync();
        }
    }, [isAuthenticated, isLoading, isFetching, memoizedTriggerSync, isInitialSyncInProgress, syncStatus]);

    // Handle thread selection
    const handleThreadSelect = useCallback(
        (thread: Thread) => {
            // Close thread if already selected
            if (selectedThread?.threadId === thread.threadId) {
                setSelectedThread(null);
                setSelectedEmail(null);
                return;
            }
            
            // Set the selected thread
            setSelectedThread(thread);
            
            // If thread has multiple emails, select the newest one
            if (thread.emails && thread.emails.length > 0) {
                setSelectedEmail(thread.emails[0]);
                // Mark as read if not already
                if (!thread.isRead) {
                    markAsRead.mutate(thread.emails[0].id);
                }
            } else {
                setSelectedEmail(null);
            }
        },
        [markAsRead, selectedThread],
    );

    // Handle email selection within a thread
    const handleEmailSelect = useCallback(
        (email: Email) => {
            setSelectedEmail((prev) => (prev?.id === email.id ? null : email));
            if (!email.isRead) {
                markAsRead.mutate(email.id);
            }
        },
        [markAsRead],
    );

    // Toggle star status for thread or email
    const handleToggleStar = useCallback(
        (item: Thread | Email, e?: React.MouseEvent<HTMLButtonElement>) => {
            if (e) e.stopPropagation();
            
            // If it's a thread, toggle star on the newest email in the thread
            if ('emails' in item && item.emails.length > 0) {
                toggleStar.mutate({
                    emailId: item.emails[0].id,
                    isStarred: !item.isStarred,
                });
            } else if ('id' in item) {
                // It's a single email
                toggleStar.mutate({
                    emailId: item.id,
                    isStarred: !item.isStarred,
                });
            }
        },
        [toggleStar],
    );

    // Handle trash email
    const handleTrashEmail = useCallback(
        (email: Email) => {
            trashEmail.mutate(email.id);
            setSelectedEmail(null);
            setSelectedThread(null);
        },
        [trashEmail],
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
        if (newPage > page && hasMore) {
        } else if (newPage < page) {
            // If going back, reset token and use offset-based pagination
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
    }, [setPage, page, hasMore]);

    // Handle page size change
    const handlePageSizeChange = useCallback((size: number) => {
        setPageSize(size);
        setPage(1);
    }, [setPageSize, setPage]);

    // Handle refresh
    const handleRefresh = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
    }, [queryClient]);

    // Handle sync
    const handleSync = useCallback(() => {
        memoizedTriggerSync();
    }, [memoizedTriggerSync]);

    // Handle sync cancellation - create this function to pass to the SyncOverlay
    const handleCancelSync = useCallback(() => {
        // There is no direct cancel function in the hook, but we can add a message
        addToast({
            variant: "success",
            message: "Sync has been canceled"
        });
        // We can't actually cancel it, but we can hide the overlay
        hasSyncedRef.current = true;
        
        // Reset any error state
        if (syncStatus === "error") {
            // Force a query invalidation to refresh the inbox state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    }, [addToast, syncStatus, queryClient]);

    // Handle category change
    const handleCategoryChange = useCallback(async (newCategory: string) => {
        // Close any open emails/threads when changing categories
        setSelectedEmail(null);
        setSelectedThread(null);
        
        // Clear any active AI search when changing categories
        if (isAISearchActive) {
            clearAISearch();
        }
        
        // Reset to first page when changing categories
        setPage(1);
        
        // Update the category
        await setCurrentCategory(newCategory);
        
        // Invalidate the query to ensure fresh data
        queryClient.invalidateQueries({ queryKey: ["inbox"] });
    }, [setCurrentCategory, setPage, queryClient, isAISearchActive, clearAISearch]);

    // When mounting the component, ensure the category is set from URL params
    useEffect(() => {
        if (currentCategory) {
            // When category changes in URL, clear selected items
            setSelectedEmail(null);
            setSelectedThread(null);
        }
    }, [currentCategory]);

    // Handle compose email
    const handleComposeNew = useCallback(() => {
        setIsComposingEmail(true);
        setReplyTo(null);
        setForwardFrom(null);
    }, []);

    // Handle close compose
    const handleCloseCompose = useCallback(() => {
        setIsComposingEmail(false);
        setReplyTo(null);
        setForwardFrom(null);
    }, []);

    // Handle email sent
    const handleEmailSent = useCallback(() => {
        handleCloseCompose();
        addToast({
            variant: "success",
            message: "Email sent successfully!",
        });
        // Refresh sent folder if we're in it
        if (currentCategory === "sent") {
            queryClient.invalidateQueries({ queryKey: ["inbox"] });
        }
    }, [addToast, currentCategory, queryClient, handleCloseCompose]);

    // Handle signout
    const handleSignOut = useCallback(() => {
        authClient.signOut();
    }, []);

    // Get compose email props
    const getComposeEmailProps = useCallback(() => {
        return {
            replyTo,
            forwardFrom,
            onSuccess: handleEmailSent,
        };
    }, [replyTo, forwardFrom, handleEmailSent]);

    // Format user data for the user menu
    const formattedUser = useMemo(() => {
        if (!user) return undefined;
        
        return {
            name: user.name || (user.email ? user.email.split('@')[0] : 'User'),
            email: user.email,
            image: user.image || undefined
        };
    }, [user]);

    // Display emails based on AI search or normal inbox
    const displayedThreads = isAISearchActive 
        ? similarEmails.map(email => ({
            threadId: email.threadId,
            emails: [email],
            subject: email.subject || "",
            from: email.from || "",
            to: email.to || "",
            snippet: email.snippet || "",
            isRead: email.isRead,
            isStarred: email.isStarred,
            labels: email.labels || [],
            internalDate: email.internalDate || "",
            aiMetadata: email.aiMetadata,
            emailCount: 1
        }))
        : threads;

    // Determine whether to show the sync overlay
    // const showSyncOverlay = isInitialSyncInProgress && syncStatus !== 'complete';

    // Calculate content widths for responsive layout
    const mainContentWidth = selectedEmail ? "50%" : "100%";
    const detailWidth = selectedEmail ? "50%" : "0";

    // Handle email/thread close
    const handleClose = useCallback(() => {
        setSelectedThread(null);
        setSelectedEmail(null);
    }, []);

    // Add keyboard shortcut for Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && (selectedEmail || selectedThread)) {
                handleClose();
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [selectedEmail, selectedThread, handleClose]);

    // Function to handle connecting Gmail account or triggering sync based on error type
    const handleErrorAction = useCallback(() => {
        if (errorType === "no_gmail_account") {
            // Redirect to settings page to connect Gmail account
            router.push("/settings/accounts");
        } else if (errorType === "invalid_credentials") {
            // Redirect to settings page to reconnect Gmail account
            router.push("/settings/accounts");
        } else if (errorType === "no_emails_synced") {
            // Trigger initial sync
            performInitialSync();
        } else {
            // For any other error, try refreshing the inbox
            handleRefresh();
        }
    }, [errorType, router, performInitialSync, handleRefresh]);

    return (
        <>
            {/* <SyncOverlay 
                isVisible={isSyncing || isInitialSyncInProgress || syncStatus === "error"}
                progress={progress}
                message={syncStatus === "error" ? syncError || "Error occurred during sync" : message}
                onCancel={handleCancelSync}
                onReset={resetSyncError}
                error={syncStatus === "error"}
                errorType={errorType}
            /> */}
            
            <Row fill padding="8" gap="8">
                <Column
                    gap="-1"
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
                        categoryOptions={allCategoryOptions}
                        onCategoryChange={handleCategoryChange}
                        onNewEmail={handleComposeNew}
                        pageSize={pageSize}
                        onPageSizeChange={handlePageSizeChange}
                        user={formattedUser}
                        onSignOut={handleSignOut}
                    />

                    <Column fill overflow="hidden">
                        <EmailList
                            threads={displayedThreads}
                            isLoading={isAISearchActive ? isAISearchLoading : isLoading}
                            selectedThreadId={selectedThread?.threadId || null}
                            selectedEmailId={selectedEmail?.id || null}
                            searchQuery={debouncedSearchQuery}
                            onSelectThread={handleThreadSelect}
                            onToggleStar={handleToggleStar}
                            error={error}
                            errorType={errorType}
                            onErrorAction={handleErrorAction}
                        />
                        <Pagination
                            page={page}
                            totalPages={totalPages}
                            onPageChange={handlePageChange}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            pageSize={pageSize}
                            totalCount={isAISearchActive ? similarEmails.length : totalCount}
                            hasMore={hasMore}
                        />
                    </Column>

                    {/* Show a simple count for AI search results */}
                    {isAISearchActive && (
                        <Row paddingX="16" marginTop="16" horizontal="center">
                            <Text variant="body-default-m">
                                {similarEmails.length > 0 
                                    ? `Found ${similarEmails.length} similar emails` 
                                    : isAISearchLoading 
                                        ? "Searching..." 
                                        : "No similar emails found"}
                            </Text>
                        </Row>
                    )}
                </Column>

                {/* Email detail view */}
                {selectedEmail && (
                    <Column 
                        gap="-1"
                        fillWidth
                        style={{ 
                            width: detailWidth, 
                            transition: "width 0.3s ease",
                            overflow: "hidden"
                        }}
                    >
                        <EmailDetail
                            email={selectedEmail}
                            thread={selectedThread}
                            onClose={handleClose}
                            onReply={() => {
                                setReplyTo(selectedEmail);
                                setForwardFrom(null);
                                setIsComposingEmail(true);
                            }}
                            onForward={() => {
                                setForwardFrom(selectedEmail);
                                setReplyTo(null);
                                setIsComposingEmail(true);
                            }}
                            onTrash={handleTrashEmail}
                            onToggleStar={handleToggleStar}
                            onSelectEmail={handleEmailSelect}
                        />
                    </Column>
                )}
            </Row>

            {/* Compose email dialog */}
            {isComposingEmail && (
                <ComposeEmail
                    {...getComposeEmailProps()}
                    onClose={handleCloseCompose}
                    onSuccess={handleEmailSent}
                />
            )}
        </>
    );
}

export default function Page() {
    return (
        <Suspense fallback={<Spinner />}>
            <InboxPage />
        </Suspense>
    );
}