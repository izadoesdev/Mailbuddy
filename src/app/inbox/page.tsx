"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  Heading,
  Text,
  Button,
  Icon,
  Input,
  Avatar,
  Row,
  Column,
  Card,
  Chip,
  StatusIndicator,
  Line,
  Skeleton,
  IconButton,
} from "@/once-ui/components";

// Mock email data based on the Email interface from the codebase
interface Email {
  id: string;
  threadId: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  isRead: boolean;
  isStarred: boolean;
  labels: string[];
  createdAt: Date;
}

// Generate realistic mock emails
const generateMockEmails = (count: number, startIndex: number = 0): Email[] => {
  const senders = [
    { name: "Alex Johnson", email: "alex@example.com" },
    { name: "Samantha Lee", email: "sam@techcorp.com" },
    { name: "Michael Chen", email: "mchen@designstudio.io" },
    { name: "Taylor Williams", email: "twilliams@fastmail.org" },
    { name: "Jordan Smith", email: "jsmith@cloudservices.net" },
    { name: "Robin Garcia", email: "robin@analytics.com" },
    { name: "Casey Morgan", email: "casey@startuphub.co" },
    { name: "Riley Thompson", email: "riley@creativeworks.design" },
  ];

  const subjects = [
    "Project update - Latest milestones achieved",
    "Meeting recap: Strategy discussion",
    "Important: Security update required",
    "Invitation: Team building event next Friday",
    "Quarterly report is now available",
    "Feedback needed on new design proposal",
    "Your subscription has been renewed",
    "Action required: Complete your profile",
    "New feature announcement",
    "Weekly newsletter: Industry insights",
  ];

  const snippets = [
    "I wanted to share some updates on the project we discussed last week. We've made significant progress on...",
    "Following up on our conversation about the strategic initiatives. As we agreed, the next steps will be...",
    "Our security team has identified the need for all users to update their passwords. Please take a moment to...",
    "We're organizing a team-building event next Friday at 3 PM. Activities will include collaborative challenges...",
    "The quarterly financial report is now available for review. Key highlights include a 15% increase in...",
    "We've completed the initial mockups for the new user interface and would appreciate your thoughts on...",
    "Your subscription to our premium service has been automatically renewed. The next billing cycle will begin...",
    "We noticed your profile is missing some key information that would help us provide a better experience...",
    "We're excited to announce the launch of our newest feature designed to streamline your workflow...",
    "This week's industry highlights include emerging trends in AI integration, market shifts in cloud services...",
  ];

  const labelSets = [
    ["Work", "Important"],
    ["Personal"],
    ["Updates", "Newsletters"],
    ["Social"],
    ["Finance"],
    ["Work", "Design"],
    ["Promotions"],
    ["Updates"],
    ["Work", "Development"],
    ["Newsletters"],
  ];

  return Array.from({ length: count }, (_, i) => {
    const index = (i + startIndex) % 10;
    const sender = senders[Math.floor(Math.random() * senders.length)];
    const randomDaysAgo = Math.floor(Math.random() * 14);
    const date = new Date();
    date.setDate(date.getDate() - randomDaysAgo);
    
    return {
      id: `email-${startIndex + i}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      threadId: `thread-${Math.floor((startIndex + i) / 3)}`,
      subject: subjects[index],
      from: `${sender.name} <${sender.email}>`,
      to: "you@yourdomain.com",
      snippet: snippets[index],
      body: `<p>${snippets[index]}</p><p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam euismod, nisl eget aliquet ultricies, nunc nisl aliquet nunc, quis aliquam nisl nunc eu nisl.</p>`,
      isRead: Math.random() > 0.3,
      isStarred: Math.random() > 0.7,
      labels: labelSets[index],
      createdAt: date,
    };
  });
};

export default function InboxPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const loader = useRef<HTMLDivElement>(null);

  // Mock function to fetch emails (simulating API call)
  const fetchEmails = useCallback(async (pageNumber: number) => {
    setIsLoading(true);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const newEmails = generateMockEmails(20, (pageNumber - 1) * 20);
    
    // Stop infinite loading after a certain number of pages
    if (pageNumber >= 5) {
      setHasMore(false);
    }
    
    setEmails(prevEmails => [...prevEmails, ...newEmails]);
    setIsLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    fetchEmails(1);
  }, [fetchEmails]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    const options = {
      root: null,
      rootMargin: "20px",
      threshold: 1.0,
    };

    const observer = new IntersectionObserver(entries => {
      const target = entries[0];
      if (target.isIntersecting && !isLoading && hasMore) {
        setPage(prevPage => {
          const nextPage = prevPage + 1;
          fetchEmails(nextPage);
          return nextPage;
        });
      }
    }, options);

    if (loader.current) {
      observer.observe(loader.current);
    }

    return () => {
      if (loader.current) {
        observer.unobserve(loader.current);
      }
    };
  }, [fetchEmails, isLoading, hasMore]);

  // Filter emails based on search query
  const filteredEmails = emails.filter(
    email =>
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.snippet.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format date to display
  const formatDate = (date: Date) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const emailDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const diffDays = Math.floor((today.getTime() - emailDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
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
      
      <Row fillWidth marginBottom="16" vertical="center" gap="16">
        <Button 
          label="Refresh" 
          prefixIcon="refresh" 
          variant="secondary" 
          onClick={() => {
            setEmails([]);
            setPage(1);
            setHasMore(true);
            fetchEmails(1);
          }}
        />
        <Row fillWidth horizontal="end" gap="8">
          <Chip label="All emails" />
          <Chip label={`Unread (${emails.filter(e => !e.isRead).length})`} />
          <Chip label={`Starred (${emails.filter(e => e.isStarred).length})`} />
        </Row>
      </Row>
      
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
          <>
            {filteredEmails.map((email, index) => (
              <React.Fragment key={email.id}>
                <Row 
                  fillWidth 
                  padding="16" 
                  gap="16" 
                  background={email.isRead ? "page" : "overlay"}
                  style={{ cursor: 'pointer' }}
                >
                  <Row horizontal="center" vertical="center" gap="12" minWidth={8}>
                    <IconButton 
                      size="s"
                      variant="tertiary" 
                      icon={email.isStarred ? "starFilled" : "star"} 
                      tooltip={email.isStarred ? "Unstar" : "Star"}
                    />
                    {!email.isRead && (
                      <StatusIndicator 
                        size="s" 
                        color="cyan" 
                      />
                    )}
                  </Row>
                  
                  <Column gap="4" fill>
                    <Row fillWidth horizontal="space-between">
                      <Text 
                        variant={email.isRead ? "body-default-m" : "body-strong-m"}
                        style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                      >
                        {email.from.split('<')[0].trim()}
                      </Text>
                      <Text 
                        variant="label-default-s" 
                        onBackground="neutral-weak"
                      >
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
                      
                      <Row gap="4">
                        {email.labels.map((label) => (
                          <Chip key={label} label={label} />
                        ))}
                      </Row>
                    </Row>
                  </Column>
                </Row>
                {index < filteredEmails.length - 1 && <Line/>}
              </React.Fragment>
            ))}
          </>
        )}
        
        {/* Loading indicator and infinite scroll trigger */}
        <div ref={loader}>
          {isLoading && (
            <Column padding="16" gap="16">
              {[1, 2, 3].map((_, i) => (
                <Skeleton key={i} shape="block" style={{ height: '80px' }} />
              ))}
            </Column>
          )}
        </div>
      </Column>
      
      {!hasMore && emails.length > 0 && (
        <Row paddingY="32" horizontal="center" fillWidth>
          <Text variant="body-default-m" onBackground="neutral-weak">
            No more emails to load
          </Text>
        </Row>
      )}
    </Column>
  );
} 