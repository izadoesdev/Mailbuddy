"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { Row, Column, Card, useToast } from "@/once-ui/components";
import { Email, InboxResponse } from "./types";
import { EmailList } from "./components/EmailList";
import { EmailDetail } from "./components/EmailDetail";
import { InboxControls } from "./components/InboxControls";
import { Pagination } from "./components/Pagination";

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [threadView, setThreadView] = useState(true);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [pageSize, setPageSize] = useState(20);
  const { addToast } = useToast();
  const isFetchingRef = useRef(false);
  const [apiError, setApiError] = useState(false);
  const lastRequestTimeRef = useRef<number>(0);

  // Fetch emails from the API
  const fetchEmails = useCallback(async (pageToFetch = 1) => {
    if (isFetchingRef.current) return;
    
    // Prevent rapid successive API calls (throttle to 3 seconds)
    const now = Date.now();
    if (apiError && now - lastRequestTimeRef.current < 3000) {
      addToast({
        variant: 'danger',
        message: "Please wait a moment before trying again."
      });
      return;
    }
    
    lastRequestTimeRef.current = now;
    
    try {
      setIsLoading(true);
      isFetchingRef.current = true;
      setApiError(false);
      
      const response = await fetch(
        `/api/inbox?page=${pageToFetch}&pageSize=${pageSize}&threadView=${threadView}`
      );
      
      if (!response.ok) throw new Error(`Failed to fetch emails`);
      
      const data: InboxResponse = await response.json();
      
      if (!data || !Array.isArray(data.emails)) {
        throw new Error("Invalid response format");
      }
      
      setEmails(processEmails(data.emails));
      setPage(pageToFetch);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize) || 1);
    } catch (error) {
      console.error("Error fetching emails:", error);
      setApiError(true);
      addToast({
        variant: 'danger',
        message: "Failed to load emails. Please try again later."
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [addToast, pageSize, threadView, apiError]);

  // Process emails to ensure dates are correctly formatted
  const processEmails = (emailsData: any[]): Email[] => {
    return emailsData.map(email => ({
      ...email,
      createdAt: email.internalDate 
        ? new Date(parseInt(email.internalDate)) 
        : new Date(email.createdAt)
    }));
  };

  // Refetch when thread view changes
  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails, threadView]);

  // Mark email as read
  const markAsRead = useCallback(async (email: Email) => {
    if (email.isRead) return;
    
    try {
      const response = await fetch(`/api/emails/${email.id}/read`, {
        method: 'PUT',
      });
      
      if (!response.ok) throw new Error('Failed to mark email as read');
      
      setEmails(prev => 
        prev.map(e => e.id === email.id ? { ...e, isRead: true } : e)
      );
    } catch (error) {
      console.error('Error marking email as read:', error);
    }
  }, []);

  // Toggle star status
  const toggleStar = useCallback(async (email: Email, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    try {
      const response = await fetch(`/api/emails/${email.id}/star`, {
        method: 'PUT',
        body: JSON.stringify({ isStarred: !email.isStarred }),
      });
      
      if (!response.ok) throw new Error('Failed to update star status');
      
      setEmails(prev => 
        prev.map(e => e.id === email.id ? { ...e, isStarred: !e.isStarred } : e)
      );
    } catch (error) {
      console.error('Error toggling star:', error);
    }
  }, []);

  // Handle email selection
  const handleEmailSelect = useCallback((email: Email) => {
    setSelectedEmail(email === selectedEmail ? null : email);
    markAsRead(email);
  }, [selectedEmail, markAsRead]);

  // Filter emails based on search query
  const filteredEmails = emails.filter(email =>
    email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Handle page size change
  const handlePageSizeChange = useCallback((size: number) => {
    setPageSize(size);
    setPage(1);
  }, []);

  return (
    <Row fillWidth paddingY="20" gap="32" style={{ height: 'calc(100vh - 80px)' }}>
      <Column 
        fillWidth
      >
        
        <Card fillWidth overflow="hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <EmailList
            emails={filteredEmails}
            isLoading={isLoading}
            selectedEmailId={selectedEmail?.id || null}
            searchQuery={searchQuery}
            onSelectEmail={handleEmailSelect}
            onToggleStar={toggleStar}
          />
        </Card>
        
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={fetchEmails}
          isLoading={isLoading}
          isFetching={isFetchingRef.current}
        />
      </Column>
      
      {selectedEmail && (
        <Column 
          style={{ 
            flexGrow: 1, 
            height: 'calc(100vh - 80px)',
            overflow: 'auto',
            width: '60vw'
          }}
        >
          <EmailDetail
            email={selectedEmail}
            onClose={() => setSelectedEmail(null)}
            onToggleStar={toggleStar}
          />
        </Column>
      )}
    </Row>
  );
} 