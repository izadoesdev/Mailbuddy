"use client";

import { useUser } from "@/libs/auth/client";
import { signOut } from "@/libs/auth/client";
import { Button, Column, Heading, Icon, Row, Spinner, Text, useToast } from "@/once-ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { redirect } from "next/navigation";
import React, { useState, useCallback, useEffect, useMemo, Suspense } from "react";
import { Pagination } from "../inbox/components/Pagination";
import { ContactDetail } from "./components/ContactDetail";
import { ContactFilters } from "./components/ContactFilters";
import { ContactList } from "./components/ContactList";
import { useContactsData } from "./hooks/useContactsData";
import type { Contact, ContactsQueryParams } from "./types";

// Categories for contact sorting
const CONTACT_CATEGORIES = [
    { value: "all", label: "All Contacts", icon: "group" },
    { value: "starred", label: "Starred", icon: "starFill" },
    { value: "frequent", label: "Frequent", icon: "repeat" },
    { value: "recent", label: "Recent", icon: "clock" },
];

// Categories for contact priorities
const PRIORITY_CATEGORIES = [
    { value: "priority-urgent", label: "Urgent", color: "danger", icon: "errorCircle" },
    { value: "priority-high", label: "High Priority", color: "warning", icon: "warningTriangle" },
    { value: "priority-medium", label: "Medium Priority", color: "info", icon: "infoCircle" },
    { value: "priority-low", label: "Low Priority", color: "success", icon: "checkCircle" },
];

function ContactsPageContent() {
    const router = useRouter();
    const { addToast } = useToast();
    const queryClient = useQueryClient();
    const { user: authUser, isLoading: isAuthLoading } = useUser();

    // Authentication check
    if (!isAuthLoading && !authUser) {
        redirect("/login");
    }

    // Format user object for components
    const user = authUser
        ? {
              name: authUser.name,
              email: authUser.email,
              image: authUser.image || undefined,
          }
        : undefined;

    // State for query parameters
    const [queryParams, setQueryParams] = useState<ContactsQueryParams>({
        page: 1,
        pageSize: 20,
        sortBy: "emailCount",
        sortOrder: "desc",
    });

    // State for selected contact
    const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

    // State for search
    const [searchQuery, setSearchQuery] = useState<string>("");

    // State for current category
    const [currentCategory, setCurrentCategory] = useState("all");

    // State to track refresh attempts
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Calculate actual query params with search query
    const effectiveQueryParams = useMemo(
        () => ({
            ...queryParams,
            query: searchQuery || undefined,
            // Map UI categories to API parameters
            priority: currentCategory.startsWith("priority-")
                ? currentCategory.replace("priority-", "")
                : undefined,
            // Handle special categories
            sortBy:
                currentCategory === "recent"
                    ? "latestEmailDate"
                    : currentCategory === "frequent"
                      ? "emailCount"
                      : queryParams.sortBy,
            // Handle starred filter
            isStarred: currentCategory === "starred" ? true : undefined,
        }),
        [queryParams, searchQuery, currentCategory],
    );

    // Fetch contacts data
    const {
        contacts,
        totalCount,
        page,
        pageSize,
        hasMore,
        isLoading,
        isError,
        error,
        refetch,
        isFetching,
        errorMessage,
        shouldShowErrorToast,
    } = useContactsData(effectiveQueryParams);

    // Handle pagination with debounce to prevent multiple rapid changes
    const handlePageChange = useCallback(
        (newPage: number) => {
            // Don't allow page changes during loading
            if (isLoading || isFetching) return;

            setQueryParams((prev) => ({ ...prev, page: newPage }));
            // Scroll to top
            window.scrollTo({ top: 0, behavior: "smooth" });
        },
        [isLoading, isFetching],
    );

    // Handle search
    const handleSearchChange = useCallback((query: string) => {
        setSearchQuery(query);
        setQueryParams((prev) => ({ ...prev, page: 1 })); // Reset to first page on new search
    }, []);

    // Handle view emails for a contact
    const handleViewEmails = useCallback(
        (contact: Contact) => {
            if (!contact || !contact.email) return;

            // Navigate to inbox with filter by contact
            router.push(`/inbox?search=from:${encodeURIComponent(contact.email)}`);
        },
        [router],
    );

    // Handle category change
    const handleCategoryChange = useCallback(
        (newCategory: string) => {
            // Close any open contact detail
            setSelectedContact(null);

            // Reset to first page when changing categories
            setQueryParams((prev) => ({ ...prev, page: 1 }));

            // Update the category
            setCurrentCategory(newCategory);

            // Invalidate the query to ensure fresh data
            queryClient.invalidateQueries({ queryKey: ["contacts"] });
        },
        [queryClient],
    );

    // Handle refreshing data with error handling
    const handleRefresh = useCallback(async () => {
        if (isRefreshing || isLoading) return;

        try {
            setIsRefreshing(true);
            await refetch();
        } catch (err) {
            // Only show the toast if we still care about this action
            if (isRefreshing) {
                addToast({
                    message: `Error refreshing contacts: ${err instanceof Error ? err.message : "Unknown error occurred"}`,
                    variant: "danger",
                });
            }
        } finally {
            setIsRefreshing(false);
        }
    }, [refetch, addToast, isRefreshing, isLoading]);

    // Handle sign out
    const handleSignOut = useCallback(async () => {
        try {
            await signOut();
            router.push("/login");
        } catch (error) {
            addToast({
                message: "Failed to sign out. Please try again.",
                variant: "danger",
            });
        }
    }, [router, addToast]);

    // Display error toast when an error occurs, but only once per error state
    useEffect(() => {
        if (shouldShowErrorToast && errorMessage) {
            addToast({
                message: `Error loading contacts: ${errorMessage}`,
                variant: "danger",
            });
        }
    }, [shouldShowErrorToast, errorMessage, addToast]);

    // Combine all category options
    const allCategories = useMemo(() => {
        return [...CONTACT_CATEGORIES, ...PRIORITY_CATEGORIES];
    }, []);

    // Calculate content widths for responsive layout
    const mainContentWidth = selectedContact ? "50%" : "100%";
    const detailWidth = selectedContact ? "50%" : "0";

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
                <ContactFilters
                    params={queryParams}
                    onChangeParams={setQueryParams}
                    disabled={isLoading || isFetching}
                    searchQuery={searchQuery}
                    onSearchChange={handleSearchChange}
                    currentCategory={currentCategory}
                    categoryOptions={allCategories}
                    onCategoryChange={handleCategoryChange}
                    onRefresh={handleRefresh}
                    isRefreshing={isRefreshing || isLoading || isFetching}
                    user={user}
                    onSignOut={handleSignOut}
                />

                <Column fill overflow="hidden">
                    <ContactList
                        contacts={contacts}
                        isLoading={isLoading}
                        isError={isError}
                        onSelectContact={setSelectedContact}
                        selectedContactId={selectedContact?.email}
                        errorMessage={errorMessage}
                    />

                    {totalCount > pageSize && (
                        <Pagination
                            page={page}
                            totalPages={Math.ceil(totalCount / pageSize)}
                            onPageChange={handlePageChange}
                            isLoading={isLoading}
                            isFetching={isFetching}
                            pageSize={pageSize}
                            totalCount={totalCount}
                            hasMore={hasMore}
                        />
                    )}
                </Column>
            </Column>

            {/* Contact detail sidebar */}
            {selectedContact && (
                <Column
                    gap="-1"
                    fillWidth
                    style={{
                        width: detailWidth,
                        transition: "width 0.3s ease",
                        overflow: "hidden",
                    }}
                >
                    <ContactDetail
                        contact={selectedContact}
                        onClose={() => setSelectedContact(null)}
                        onViewEmails={handleViewEmails}
                    />
                </Column>
            )}
        </Row>
    );
}

export default function ContactsPage() {
    return (
        <Suspense fallback={<Spinner />}>
            <ContactsPageContent />
        </Suspense>
    );
}
