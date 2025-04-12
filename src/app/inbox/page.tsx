"use client";

import type { Email, GmailLabel } from "./types";
import { Row, Column, useToast, Text, Button, Spinner } from "@/once-ui/components";
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
import { useState, useCallback, useEffect, useRef, Suspense, useMemo } from "react";
import { useUser } from "@/libs/auth/client";
import { redirect, useRouter } from "next/navigation";
import { createParser, useQueryState } from "nuqs";
import { ComposeEmail } from "./components/ComposeEmail";
import { EMAIL_CATEGORIES, PRIORITY_LEVELS } from "@/app/ai/new/constants";

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

    // Combine all category options
    const allCategoryOptions = useMemo(() => {
        return [
            ...STANDARD_CATEGORIES,
            ...PRIORITY_CATEGORIES,
            ...AI_CATEGORIES
        ];
    }, []);

    // Determine if there are more pages available based on nextPageToken
    const hasMorePages = !!nextPageToken;

    // Use AI search hook
    const { similarEmails, isAISearchActive, isAISearchLoading, performAISearch, clearAISearch } =
        useAISearch();

    // Pass authentication state to hooks
    const { markAsRead, toggleStar, trashEmail } = useEmailMutations({ enabled: isAuthenticated });
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

    // Handle trash email
    const handleTrash = useCallback(
        (email: Email) => {
            trashEmail.mutate(email.id);
            setSelectedEmail(null); // Close the email detail view after trashing
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

    // Filter emails based on selected AI category
    const displayedEmails = useMemo(() => {
        if (isAISearchActive) {
            return similarEmails;
        }
        
        // For standard categories, just return the server-filtered emails
        if (STANDARD_CATEGORIES.some(c => c.value === currentCategory)) {
            return emails;
        }
        
        // For priority-based categories, filter client-side by priority
        if (currentCategory.startsWith('priority-')) {
            const priorityLevel = currentCategory.replace('priority-', '');
            
            switch (priorityLevel) {
                case 'urgent':
                    return emails.filter(email => 
                        email.aiMetadata?.priority === PRIORITY_LEVELS.URGENT
                    );
                case 'high':
                    return emails.filter(email => 
                        email.aiMetadata?.priority === PRIORITY_LEVELS.HIGH
                    );
                case 'medium':
                    return emails.filter(email => 
                        email.aiMetadata?.priority === PRIORITY_LEVELS.MEDIUM
                    );
                case 'low':
                    return emails.filter(email => 
                        email.aiMetadata?.priority === PRIORITY_LEVELS.LOW
                    );
                default:
                    return emails;
            }
        }
        
        // For AI categories, filter client-side by category
        if (currentCategory.startsWith('category-')) {
            const categoryName = currentCategory.replace('category-', '');
            
            // Match the category against AI metadata
            return emails.filter(email => {
                if (!email.aiMetadata?.category) return false;
                
                const lowerCaseCategory = email.aiMetadata.category.toLowerCase();
                const categorySynonyms = getCategorySynonyms(categoryName);
                
                return categorySynonyms.some(synonym => 
                    lowerCaseCategory.includes(synonym)
                );
            });
        }
        
        return emails;
    }, [emails, similarEmails, isAISearchActive, currentCategory]);

    // Helper to get synonyms for a category
    function getCategorySynonyms(category: string): string[] {
        switch (category) {
            case 'work':
                return ['work', 'business', 'professional'];
            case 'financial':
                return ['financial', 'finance', 'bank', 'money', 'payment'];
            case 'events':
                return ['event', 'invitation', 'party', 'meeting'];
            case 'travel':
                return ['travel', 'flight', 'hotel', 'booking', 'trip', 'vacation'];
            case 'newsletters':
                return ['newsletter', 'subscription', 'update'];
            case 'receipts':
                return ['receipt', 'purchase', 'order confirmation'];
            // Add more synonyms for other categories as needed
            default:
                return [category];
        }
    }

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
                <div style="background: rgb(47, 47, 47);">
                    <div style="display: flex; justify-content: space-between; font-size: 13px; color: white;">
                        <p style="padding: 1rem; font-weight: bold;">${originalSender}</p>
                        <p style="padding: 1rem;">${new Date(replyTo.createdAt || new Date()).toLocaleString()}</p>
                    </div>
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
            <Column>
            </Column>
        );  
    }

    if (!user) {
        return null;
    }

    return (
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
                    onNewEmail={handleNewEmail}
                    pageSize={pageSize}
                    onPageSizeChange={handlePageSizeChange}
                />

                <Column fill overflow="hidden">
                    <EmailList
                        emails={displayedEmails}
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
                        totalCount={isAISearchActive ? similarEmails.length : displayedEmails.length}
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
                        onTrash={handleTrash}
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
        <Suspense fallback={<Spinner/>}>
            <InboxPage />
        </Suspense>
    )
}