"use client";

import React, { useState, useCallback, useEffect } from "react";
import { Row, Column, Card, useToast } from "@/once-ui/components";
import { Email } from "./types";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { InboxControls } from "./components/InboxControls";
import { Pagination } from "./components/Pagination";
import { useQueryClient } from "@tanstack/react-query";
import { useDebounce } from "./hooks/useDebounce";
import { useInboxData } from "./hooks/useInboxData";
import { useEmailMutations } from "./hooks/useEmailMutations";
import { useBackgroundSync } from "./hooks/useBackgroundSync";

export default function InboxPage() {
  // State
  const [searchQuery, setSearchQuery] = useState("");
  const [threadView, setThreadView] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Hooks
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Use our custom hooks
  const { emails, totalPages, totalCount, isLoading, isFetching } = useInboxData({
    page,
    pageSize,
    threadView,
    searchQuery: debouncedSearchQuery,
  });

  const { markAsRead, toggleStar } = useEmailMutations();
  const { triggerSync, isSyncing } = useBackgroundSync();

  // Trigger a sync when the inbox is first loaded
  useEffect(() => {
    // Only trigger on first render
    if (emails.length === 0 && !isLoading && !isFetching) {
      triggerSync();
    }
  }, []);

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
  }, []);

  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  // Toggle thread view
  const handleThreadViewChange = useCallback(() => {
    setThreadView((prev) => !prev);
    setPage(1);
  }, []);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["emails"] });
  }, [queryClient]);

  // Handle sync
  const handleSync = useCallback(() => {
    triggerSync();
  }, [triggerSync]);

  // Calculate width for main content
  const mainContentWidth = selectedEmail ? "40%" : "100%";

  return (
    <Row fillWidth paddingY="20" gap="32" style={{ height: "calc(100vh - 80px)" }}>
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
          threadView={threadView}
          onThreadViewChange={handleThreadViewChange}
          isLoading={isLoading}
          isFetching={isFetching}
          onRefresh={handleRefresh}
          onSync={handleSync}
          isSyncing={isSyncing}
          pageSize={pageSize}
          onPageSizeChange={handlePageSizeChange}
        />

        <Card fillWidth overflow="hidden" style={{ height: "calc(100vh - 200px)" }}>
          <EmailList
            emails={emails}
            isLoading={isLoading}
            selectedEmailId={selectedEmail?.id || null}
            searchQuery={debouncedSearchQuery}
            onSelectEmail={handleEmailSelect}
            onToggleStar={handleToggleStar}
          />
        </Card>

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

      {selectedEmail && (
        <Column
          style={{
            flexGrow: 1,
            height: "calc(100vh - 80px)",
            overflow: "auto",
            width: "60%",
            transition: "width 0.3s ease",
          }}
        >
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onToggleStar={handleToggleStar}
          />
        </Column>
      )}
    </Row>
  );
}
