"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Heading,
  Text,
  Button,
  Icon,
  Input,
  Row,
  Column,
  Chip,
  StatusIndicator,
  Line,
  Skeleton,
  useToast,
} from "@/once-ui/components";

// Email interface
interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  snippet: string;
  isRead: boolean;
  labels: string[];
  createdAt: Date;
  internalDate?: string;
}

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const { addToast } = useToast();
  const isFetchingRef = useRef(false);

  // Fetch emails from the API
  const fetchEmails = useCallback(async (pageToFetch = 1) => {
    if (isFetchingRef.current) return;
    
    try {
      setIsLoading(true);
      isFetchingRef.current = true;
      
      const response = await fetch(`/api/inbox?page=${pageToFetch}&pageSize=20`);
      
      if (!response.ok) throw new Error(`Failed to fetch emails`);
      
      const data = await response.json();
      
      setEmails(data.emails?.map((email: any) => ({
        ...email,
        // Convert internalDate (milliseconds since epoch) to Date if available
        // Otherwise fall back to createdAt
        createdAt: email.internalDate 
          ? new Date(parseInt(email.internalDate)) 
          : new Date(email.createdAt)
      })) || []);
      setPage(pageToFetch);
      setTotalPages(Math.ceil(data.totalCount / data.pageSize) || 1);
    } catch (error) {
      console.error("Error fetching emails:", error);
      addToast({
        variant: 'danger',
        message: "Failed to load emails. Please try again."
      });
    } finally {
      setIsLoading(false);
      isFetchingRef.current = false;
    }
  }, [addToast]);

  // Only fetch emails on initial mount
  useEffect(() => {
    const initialFetch = async () => {
      await fetchEmails(1);
    };
    initialFetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filter emails based on search query
  const filteredEmails = emails
    .filter(email =>
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  // Format date to display
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.floor((today.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24));
    
    // Show full date format with time for all emails
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Column fillWidth paddingY="20" maxWidth="l" horizontal="center" paddingX="s">
      <Row fillWidth horizontal="space-between" vertical="center" paddingBottom="20">
        <Heading as="h1" variant="display-default-l">Inbox</Heading>
        <Input
          id="search-emails"
          label="Search emails"
          labelAsPlaceholder
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </Row>
      
      <Row marginBottom="16">
        <Button 
          label="Refresh" 
          prefixIcon="refresh" 
          variant="secondary" 
          onClick={() => fetchEmails(1)}
          disabled={isLoading || isFetchingRef.current}
        />
      </Row>
      
      {/* Loading indicator */}
      {isLoading && (
        <Text variant="body-strong-m" marginBottom="16">Loading emails...</Text>
      )}
      
      <Column fillWidth gap="1" radius="l" border="neutral-alpha-weak" overflow="hidden">
        {filteredEmails.length === 0 && !isLoading ? (
          <Column padding="64" horizontal="center" vertical="center" gap="16">
            <Icon name="inbox" size="xl" />
            <Text variant="body-strong-l">No emails found</Text>
            <Text variant="body-default-m" onBackground="neutral-weak">
              {searchQuery ? "Try adjusting your search query" : "Your inbox is empty"}
            </Text>
          </Column>
        ) : (
          filteredEmails.map((email, index) => (
            <React.Fragment key={email.id}>
              <Row 
                fillWidth 
                padding="16" 
                gap="16" 
                background={email.isRead ? "page" : "overlay"}
                style={{ cursor: 'pointer' }}
              >
                {!email.isRead && <StatusIndicator size="s" color="cyan" />}
                
                <Column gap="4" fill>
                  <Row fillWidth horizontal="space-between">
                    <Text 
                      variant={email.isRead ? "body-default-m" : "body-strong-m"}
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {email.from?.split('<')[0].trim()}
                    </Text>
                    <Text variant="label-default-s" onBackground="neutral-weak">
                      {formatDate(email.createdAt)}
                    </Text>
                  </Row>
                  
                  <Text 
                    variant={email.isRead ? "body-default-m" : "body-strong-m"}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {email.subject}
                  </Text>
                  
                  <Row fillWidth horizontal="space-between">
                    <Text 
                      variant="body-default-s" 
                      onBackground="neutral-weak"
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}
                    >
                      {email.snippet}
                    </Text>
                    
                    {email.labels?.length > 0 && (
                      <Row gap="4">
                        {email.labels.map(label => (
                          <Chip key={label} label={label} />
                        ))}
                      </Row>
                    )}
                  </Row>
                </Column>
              </Row>
              {index < filteredEmails.length - 1 && <Line/>}
            </React.Fragment>
          ))
        )}
        
        {/* Loading skeleton */}
        {isLoading && (
          <Column padding="16" gap="16">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} shape="block" style={{ height: '80px' }} />
            ))}
          </Column>
        )}
      </Column>
      
      {/* Pagination Controls */}
      {!isLoading && totalPages > 1 && (
        <Row paddingY="32" gap="8" horizontal="center">
          <Button
            variant="secondary"
            label="Previous"
            prefixIcon="arrowLeft"
            onClick={() => fetchEmails(page - 1)}
            disabled={page === 1 || isLoading || isFetchingRef.current}
          />
          
          <Text variant="body-default-m" paddingX="8">
            Page {page} of {totalPages}
          </Text>
          
          <Button
            variant="secondary"
            label="Next"
            suffixIcon="arrowRight"
            onClick={() => fetchEmails(page + 1)}
            disabled={page >= totalPages || isLoading || isFetchingRef.current}
          />
        </Row>
      )}
    </Column>
  );
} 