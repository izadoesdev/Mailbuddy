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
  Card,
  Switch,
  Badge,
  IconButton,
  Avatar,
  Select,
} from "@/once-ui/components";

// Email interface
interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to?: string;
  snippet: string;
  body?: string;
  isRead: boolean;
  isStarred?: boolean;
  labels: string[];
  createdAt: Date;
  internalDate?: string;
}

// API response interface
interface InboxResponse {
  emails: Email[];
  totalCount: number;
  hasMore: boolean;
  page: number;
  pageSize: number;
}

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

  // Fetch emails from the API
  const fetchEmails = useCallback(async (pageToFetch = 1) => {
    if (isFetchingRef.current) return;
    
    try {
      setIsLoading(true);
      isFetchingRef.current = true;
      
      const response = await fetch(
        `/api/inbox?page=${pageToFetch}&pageSize=${pageSize}&threadView=${threadView}`
      );
      
      if (!response.ok) throw new Error(`Failed to fetch emails`);
      
      const data: InboxResponse = await response.json();
      
      setEmails(processEmails(data.emails));
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
  }, [addToast, pageSize, threadView]);

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
  const filteredEmails = emails
    .filter(email =>
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet?.toLowerCase().includes(searchQuery.toLowerCase())
    );

  // Extract name from email address
  const extractName = (emailString: string) => {
    const namePart = emailString?.split('<')[0].trim();
    return namePart || emailString || 'Unknown';
  };

  // Get initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  // Format date to display
  const formatDate = (date: Date) => {
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === now.toDateString()) {
      // Today, show time only
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      // Yesterday
      return 'Yesterday';
    } else if (now.getFullYear() === date.getFullYear()) {
      // Same year, show month and day
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } else {
      // Different year, show with year
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
    }
  };

  // Render email list item
  const renderEmailItem = (email: Email, index: number) => {
    const isSelected = selectedEmail?.id === email.id;
    const senderName = extractName(email.from);
    
    return (
      <React.Fragment key={email.id}>
        <Row 
          fillWidth 
          padding="16" 
          gap="16" 
          background={isSelected ? "neutral-weak" : email.isRead ? "page" : "overlay"}
          style={{ cursor: 'pointer' }}
          onClick={() => handleEmailSelect(email)}
        >
          <Row gap="12" vertical="center">
            <IconButton
              variant="ghost"
              size="s"
              icon={email.isStarred ? "starFill" : "star"}
              onClick={(e: React.MouseEvent<HTMLButtonElement>) => toggleStar(email, e)}
              color={email.isStarred ? "warning" : "neutral"}
            />
            <Avatar 
              size="m"
              value={getInitials(senderName)}
            />
          </Row>
          
          <Column gap="4" fill>
            <Row fillWidth horizontal="space-between">
              <Text 
                variant={email.isRead ? "body-default-m" : "body-strong-m"}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {senderName}
              </Text>
              <Row gap="8" vertical="center">
                {email.labels?.includes('IMPORTANT') && (
                  <Badge title="Important" />
                )}
                <Text variant="label-default-s" onBackground="neutral-weak">
                  {formatDate(email.createdAt)}
                </Text>
              </Row>
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
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '70%' }}
              >
                {email.snippet}
              </Text>
              
              {email.labels?.length > 0 && email.labels.some(l => !['IMPORTANT', 'UNREAD', 'INBOX'].includes(l)) && (
                <Row gap="4">
                  {email.labels
                    .filter(label => !['IMPORTANT', 'UNREAD', 'INBOX'].includes(label))
                    .slice(0, 2)
                    .map(label => (
                      <Chip key={label} label={label.replace('CATEGORY_', '')} />
                    ))}
                  {email.labels.filter(l => !['IMPORTANT', 'UNREAD', 'INBOX'].includes(l)).length > 2 && (
                    <Chip label={`+${email.labels.length - 2}`} />
                  )}
                </Row>
              )}
            </Row>
          </Column>
        </Row>
        {index < filteredEmails.length - 1 && <Line color="neutral-alpha-weak" />}
      </React.Fragment>
    );
  };

  // Render email detail view
  const renderEmailDetail = () => {
    if (!selectedEmail) return null;
    
    const senderName = extractName(selectedEmail.from);
    
    return (
      <Card fillWidth padding="24">
        <Column gap="24">
          <Row horizontal="space-between" vertical="center">
            <Heading>{selectedEmail.subject}</Heading>
            <IconButton
              variant="ghost"
              icon="close"
              onClick={() => setSelectedEmail(null)}
            />
          </Row>
          
          <Row gap="16" vertical="center">
            <Avatar 
              size="l"
              value={getInitials(senderName)}
            />
            <Column gap="4">
              <Text variant="body-strong-m">{senderName}</Text>
              <Text variant="body-default-s" onBackground="neutral-weak">
                {selectedEmail.from}
              </Text>
              <Text variant="label-default-s" onBackground="neutral-weak">
                To: {selectedEmail.to || 'me'}
              </Text>
            </Column>
            <Text variant="label-default-s" onBackground="neutral-weak" style={{ marginLeft: 'auto' }}>
              {formatDate(selectedEmail.createdAt)}
            </Text>
          </Row>
          
          {selectedEmail.labels?.length > 0 && (
            <Row gap="8" wrap>
              {selectedEmail.labels
                .filter(label => !['UNREAD', 'INBOX'].includes(label))
                .map(label => (
                  <Chip 
                    key={label} 
                    label={label.replace('CATEGORY_', '')}
                  />
                ))}
            </Row>
          )}
          
          <Line />
          
          <div 
            dangerouslySetInnerHTML={{ __html: selectedEmail.body || selectedEmail.snippet || '' }}
            style={{ maxWidth: '100%', overflow: 'auto' }}
          />
          
          <Row gap="16">
            <Button
              variant="secondary"
              label="Reply"
              prefixIcon="reply"
            />
            <Button
              variant="secondary"
              label="Forward"
              prefixIcon="arrowRight"
            />
          </Row>
        </Column>
      </Card>
    );
  };

  return (
    <Row fillWidth paddingY="20" gap="32" style={{ height: 'calc(100vh - 80px)' }}>
      <Column 
        fillWidth 
        style={{ 
          maxWidth: selectedEmail ? '400px' : '1200px',
          transition: 'max-width 0.3s ease'
        }}
      >
        <Row 
          fillWidth 
          horizontal="space-between" 
          vertical="center" 
          paddingBottom="20"
          paddingX="16"
        >
          <Heading as="h1" variant="display-default-l">Inbox</Heading>
          <Row gap="16" vertical="center">
            <Input
              id="search-emails"
              label="Search emails"
              labelAsPlaceholder
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              hasPrefix={<Icon name="search" size="s" />}
            />
            <Row gap="8" vertical="center">
              <Text variant="body-default-s">Thread view</Text>
              <Switch 
                id="thread-toggle"
                isChecked={threadView}
                onToggle={() => setThreadView(!threadView)}
              />
            </Row>
          </Row>
        </Row>
        
        <Row paddingX="16" marginBottom="16" gap="8">
          <Button 
            label="Refresh" 
            prefixIcon="refresh" 
            variant="secondary" 
            onClick={() => fetchEmails(1)}
            disabled={isLoading || isFetchingRef.current}
          />
          <Select
            id="page-size-select"
            label={`${pageSize} per page`}
            onChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
            value={pageSize.toString()}
            options={[
              { value: "10", label: "10 per page" },
              { value: "20", label: "20 per page" },
              { value: "50", label: "50 per page" }
            ]}
          />
        </Row>
        
        <Card fillWidth overflow="hidden" style={{ height: 'calc(100vh - 200px)' }}>
          {isLoading && (
            <Column padding="16" gap="16">
              {[1, 2, 3, 4, 5].map(i => (
                <Skeleton key={i} shape="block" style={{ height: '80px' }} />
              ))}
            </Column>
          )}
          
          {!isLoading && filteredEmails.length === 0 && (
            <Column padding="64" horizontal="center" vertical="center" gap="16">
              <Icon name="inbox" size="xl" />
              <Text variant="body-strong-l">No emails found</Text>
              <Text variant="body-default-m" onBackground="neutral-weak">
                {searchQuery ? "Try adjusting your search query" : "Your inbox is empty"}
              </Text>
            </Column>
          )}
          
          {!isLoading && filteredEmails.length > 0 && (
            <Column 
              fillWidth 
              gap="1" 
              overflow="auto" 
              style={{ maxHeight: 'calc(100vh - 200px)' }}
            >
              {filteredEmails.map(renderEmailItem)}
            </Column>
          )}
        </Card>
        
        {!isLoading && totalPages > 1 && (
          <Row paddingY="16" gap="8" horizontal="center">
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
      
      {selectedEmail && (
        <Column 
          style={{ 
            flexGrow: 1, 
            height: 'calc(100vh - 80px)',
            overflow: 'auto'
          }}
        >
          {renderEmailDetail()}
        </Column>
      )}
    </Row>
  );
} 