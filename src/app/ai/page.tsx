"use client";

import React, { useState, useEffect } from "react";
import type { FormEvent } from "react";
import {
  Heading,
  Text,
  Button,
  Icon,
  Row,
  Column,
  Card,
  Input,
  IconButton,
  Chip,
  Avatar,
  Badge,
  Line,
  Spinner,
  Feedback,
  SegmentedControl,
  Flex,
} from "@/once-ui/components";
import { searchSimilarEmails } from "./actions/searchSimilarEmails";
import { processEmail } from "./actions/groq/exports";
import type { Email, InboxResponse } from "../inbox/types";
import { formatDate } from "../inbox/utils";
import { extractName, getInitials } from "../inbox/utils";

// Type definitions
type SimilarEmailResult = {
  id: string;
  score: number;
  metadata?: {
    subject?: string;
    userId?: string;
  };
}

type AIProcessedEmail = {
  id: string;
  category?: string;
  summary?: string;
  priority?: string;
  priorityExplanation?: string;
  processed: boolean;
  fromCache?: boolean;
  processingTime?: number;
  error?: string;
}

export default function AIPage() {
  // State management
  const [emails, setEmails] = useState<Email[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [similarEmails, setSimilarEmails] = useState<SimilarEmailResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [aiProcessing, setAiProcessing] = useState<Record<string, boolean>>({});
  const [processedEmails, setProcessedEmails] = useState<Record<string, AIProcessedEmail>>({});
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [activeTab, setActiveTab] = useState('inbox');

  // Fetch inbox data
  useEffect(() => {
    async function fetchEmails() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/inbox?page=${page}&pageSize=12&threadView=true`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch emails');
        }
        
        const data: InboxResponse = await response.json();
        
        setEmails(data.emails);
        setHasMore(data.hasMore);
        setTotalCount(data.totalCount);
      } catch (error) {
        console.error('Error fetching emails:', error);
        setError('Failed to load emails. Please try again later.');
      } finally {
        setLoading(false);
      }
    }
    
    fetchEmails();
  }, [page]);

  // Handle search for similar emails
  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const results = await searchSimilarEmails(searchQuery);
      
      if (results && Array.isArray(results)) {
        setSimilarEmails(results as SimilarEmailResult[]);
        
        // Switch to search results tab
        setActiveTab('search');
      } else {
        // Handle error case
        const errorMessage = (results as any).error || 'Error searching for similar emails';
        console.error('Error searching similar emails:', errorMessage);
        setError(`Search failed: ${errorMessage}`);
        setSimilarEmails([]);
      }
    } catch (error) {
      console.error('Error searching similar emails:', error);
      setError('Failed to search emails. Please try again later.');
      setSimilarEmails([]);
    } finally {
      setLoading(false);
    }
  }

  // Handle analyzing an email with Groq AI
  async function handleAnalyzeEmail(email: Email) {
    // Set loading state for this specific email
    setAiProcessing(prev => ({ ...prev, [email.id]: true }));
    setError(null);
    
    try {
      const result = await processEmail({
        id: email.id,
        subject: email.subject || "No Subject",
        body: email.body || email.snippet || "",
        from: email.from,
        to: email.to,
        createdAt: email.createdAt
      });
      
      if (result.processed) {
        // Add to processed emails map
        setProcessedEmails(prev => ({
          ...prev,
          [email.id]: result as AIProcessedEmail
        }));
        
        setSuccessMessage(`Email "${email.subject}" analyzed successfully!`);
        
        // Switch to AI insights tab
        setActiveTab('ai_insights');
      } else {
        setError(`Failed to analyze email: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error analyzing email:', error);
      setError('Failed to analyze email. Please try again.');
    } finally {
      // Clear loading state for this email
      setAiProcessing(prev => ({ ...prev, [email.id]: false }));
      
      // Auto-clear success message after 3 seconds
      if (successMessage) {
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }
    }
  }

  // Helper functions
  const getPriorityColor = (priority?: string) => {
    if (!priority) return "neutral";
    
    switch(priority.toLowerCase()) {
      case 'urgent': return "error";
      case 'high': return "warning";
      case 'medium': return "info";
      case 'low': return "success";
      default: return "neutral";
    }
  };
  
  const getProcessedEmailsArray = () => {
    return Object.values(processedEmails).filter(e => e.processed);
  };

  const tabOptions = [
    { value: 'inbox', label: 'Inbox' },
    { value: 'search', label: 'Search Results', disabled: similarEmails.length === 0 },
    { value: 'ai_insights', label: 'AI Insights', disabled: getProcessedEmailsArray().length === 0 }
  ];

  const handleTabChange = (value: string) => {
    setActiveTab(value);
  };

  return (
    <Column maxWidth="xl" paddingY="24" paddingX="16" gap="32" style={{ margin: "0 auto" }}>
      <Row horizontal="space-between" vertical="center" paddingBottom="16">
        <Heading variant="display-default-l" as="h1">AI Email Assistant</Heading>
      </Row>
      
      {/* Search section */}
      <Card fill padding="24" radius="xl">
        <Column gap="16">
          <Heading variant="heading-strong-m" as="h2">Search Similar Emails</Heading>
          <Text variant="body-default-m">Use AI to find semantically similar emails in your inbox</Text>
          
          <form onSubmit={handleSearch}>
            <Row gap="16" vertical="center">
              <Input
                id="search-query"
                label="What are you looking for?"
                labelAsPlaceholder
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                hasPrefix={<Icon name="search" size="s" />}
                style={{ flexGrow: 1 }}
              />
              <Button
                type="submit"
                disabled={loading || !searchQuery.trim()}
                prefixIcon="sparkles"
                variant="primary"
                label={loading ? "Searching..." : "Find Similar"}
                loading={loading}
              />
            </Row>
          </form>
        </Column>
      </Card>
      
      {/* Messages */}
      {error && (
        <Feedback 
          variant="danger" 
          title="Error" 
          description={error}
          showCloseButton
          onClose={() => setError(null)}
        />
      )}
      
      {successMessage && (
        <Feedback 
          variant="success" 
          title="Success" 
          description={successMessage}
          showCloseButton
          onClose={() => setSuccessMessage(null)}
        />
      )}
      
      {/* Tabs section */}
      <SegmentedControl
        buttons={tabOptions}
        defaultSelected={activeTab}
        onToggle={handleTabChange}
      />
      
      {/* Email content based on active tab */}
      <Card fill padding="0" radius="xl" border="neutral-alpha-weak">
        {activeTab === 'inbox' && (
          <Column fill>
            <Flex direction="row" horizontal="space-between" padding="16" vertical="center" style={{ flexWrap: 'wrap', gap: '8px' }}>
              <Text variant="heading-strong-s">{loading ? 'Loading emails...' : `Inbox (${totalCount})`}</Text>
              
              <Row gap="8">
                <Button
                  size="s"
                  variant="tertiary"
                  label="Previous"
                  prefixIcon="arrowLeft"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                />
                <Text variant="label-default-s" padding="8">Page {page}</Text>
                <Button
                  size="s"
                  variant="tertiary"
                  label="Next"
                  suffixIcon="arrowRight"
                  disabled={!hasMore || loading}
                  onClick={() => setPage(p => p + 1)}
                />
              </Row>
            </Flex>
            
            <Line color="neutral-alpha-weak" />
            
            {loading ? (
              <Column center paddingY="64">
                <Spinner size="m" />
                <Text variant="body-default-m" marginTop="16">Loading emails...</Text>
              </Column>
            ) : emails.length > 0 ? (
              <Column fill>
                {emails.map((email, index) => {
                  // Check if this email has AI metadata
                  const hasAiMetadata = email.aiMetadata !== null && email.aiMetadata !== undefined;
                  const aiCategory = hasAiMetadata ? email.aiMetadata.category : null;
                  const aiPriority = hasAiMetadata ? email.aiMetadata.priority : null;
                  
                  // Determine priority color if available
                  const priorityColor = aiPriority ? getPriorityColor(aiPriority) : undefined;

                  return (
                    <React.Fragment key={email.id}>
                      <Flex 
                        direction="row"
                        fill 
                        padding="16" 
                        gap="16"
                        background={email.isRead ? "page" : "overlay"}
                        style={{ flexWrap: 'wrap' }}
                      >
                        <Avatar 
                          size="m" 
                          value={getInitials(extractName(email.from))} 
                        />
                        
                        <Column gap="4" flex={1}>
                          <Flex direction="row" horizontal="space-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <Text 
                              variant={email.isRead ? "body-default-m" : "body-strong-m"}
                              style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                            >
                              {extractName(email.from)}
                            </Text>
                            <Row gap="8" vertical="center">
                              {/* Show AI badges if metadata exists */}
                              {hasAiMetadata && aiCategory && (
                                <Chip 
                                  label={aiCategory} 
                                  color="brand"
                                  size="s"
                                />
                              )}
                              {hasAiMetadata && aiPriority && (
                                <Chip 
                                  label={aiPriority} 
                                  color={priorityColor}
                                  size="s"
                                />
                              )}
                              {email.labels?.includes("IMPORTANT") && (
                                <Badge title="Important" />
                              )}
                              <Text variant="label-default-s" onBackground="neutral-weak">
                                {formatDate(email.createdAt)}
                              </Text>
                            </Row>
                          </Flex>
                          
                          <Text
                            variant={email.isRead ? "body-default-m" : "body-strong-m"}
                            style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {email.subject || 'No Subject'}
                          </Text>
                          
                          <Flex direction="row" horizontal="space-between" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <Text
                              variant="body-default-s"
                              onBackground="neutral-weak"
                              style={{ 
                                overflow: "hidden", 
                                textOverflow: "ellipsis", 
                                whiteSpace: "nowrap", 
                                maxWidth: "100%" 
                              }}
                            >
                              {/* Show summary if available, otherwise snippet */}
                              {hasAiMetadata && email.aiMetadata.summary 
                                ? email.aiMetadata.summary 
                                : email.snippet}
                            </Text>
                            
                            <Button
                              size="s"
                              variant={processedEmails[email.id] || hasAiMetadata ? "secondary" : "primary"}
                              prefixIcon="sparkles"
                              label={
                                aiProcessing[email.id] 
                                  ? "Analyzing..." 
                                  : (processedEmails[email.id] || hasAiMetadata)
                                    ? "View Analysis" 
                                    : "Analyze with AI"
                              }
                              loading={aiProcessing[email.id]}
                              disabled={aiProcessing[email.id]}
                              onClick={() => {
                                // If we already have metadata in email object or in processed state, go to insights tab
                                if (processedEmails[email.id] || hasAiMetadata) {
                                  // If metadata is in the email object but not in our state, add it
                                  if (hasAiMetadata && !processedEmails[email.id]) {
                                    setProcessedEmails(prev => ({
                                      ...prev,
                                      [email.id]: {
                                        id: email.id,
                                        category: email.aiMetadata.category,
                                        summary: email.aiMetadata.summary,
                                        priority: email.aiMetadata.priority,
                                        priorityExplanation: email.aiMetadata.priorityExplanation,
                                        processed: true,
                                        fromCache: true
                                      }
                                    }));
                                  }
                                  setActiveTab('ai_insights');
                                } else {
                                  // Otherwise analyze with AI
                                  handleAnalyzeEmail(email);
                                }
                              }}
                            />
                          </Flex>
                        </Column>
                      </Flex>
                      {index < emails.length - 1 && <Line color="neutral-alpha-weak" />}
                    </React.Fragment>
                  );
                })}
              </Column>
            ) : (
              <Column center paddingY="64">
                <Icon name="inbox" size="m" color="neutral-medium" />
                <Text variant="body-default-m" marginTop="16">No emails found</Text>
              </Column>
            )}
          </Column>
        )}
        
        {activeTab === 'search' && similarEmails.length > 0 && (
          <Column fill>
            <Row padding="16" vertical="center">
              <Text variant="heading-strong-s">Search Results ({similarEmails.length})</Text>
            </Row>
            
            <Line color="neutral-alpha-weak" />
            
            <Column fill>
              {similarEmails.map((result, index) => (
                <React.Fragment key={result.id}>
                  <Flex direction="row" fill padding="16" gap="16" style={{ flexWrap: 'wrap' }}>
                    <Column gap="2" style={{ width: '64px', flexShrink: 0, marginBottom: '8px' }}>
                      <Text variant="label-strong-s">Score</Text>
                      <Chip 
                        label={result.score.toFixed(4)} 
                        color={result.score > 0.75 ? "success" : result.score > 0.5 ? "info" : "neutral"}
                      />
                    </Column>
                    
                    <Column gap="8" flex={1}>
                      <Text variant="body-strong-m">{result.metadata?.subject || 'No Subject'}</Text>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        ID: {result.id}
                      </Text>
                      
                      <Row horizontal="end">
                        <Button
                          size="s"
                          variant="secondary"
                          prefixIcon="eye"
                          label="View Email"
                          onClick={() => {
                            // This would typically navigate to the email or show a modal
                            // For now, we'll just log
                            console.log("View email:", result.id);
                          }}
                        />
                      </Row>
                    </Column>
                  </Flex>
                  {index < similarEmails.length - 1 && <Line color="neutral-alpha-weak" />}
                </React.Fragment>
              ))}
            </Column>
          </Column>
        )}
        
        {activeTab === 'ai_insights' && (
          <Column fill>
            <Row padding="16" vertical="center">
              <Text variant="heading-strong-s">AI Analyzed Emails ({getProcessedEmailsArray().length})</Text>
            </Row>
            
            <Line color="neutral-alpha-weak" />
            
            {getProcessedEmailsArray().length === 0 ? (
              <Column center paddingY="64">
                <Icon name="sparkles" size="m" color="neutral-medium" />
                <Text variant="body-default-m" marginTop="16">No analyzed emails yet</Text>
              </Column>
            ) : (
              <Column fill>
                {getProcessedEmailsArray().map((processedEmail, index) => {
                  const email = emails.find(e => e.id === processedEmail.id);
                  const priorityColor = getPriorityColor(processedEmail.priority);
                  
                  return (
                    <React.Fragment key={processedEmail.id}>
                      <Row fill padding="24" gap="16">
                        <Column gap="16" flex={1}>
                          <Flex direction="row" horizontal="space-between" vertical="center" style={{ flexWrap: 'wrap', gap: '8px' }}>
                            <Text variant="heading-strong-m">
                              {email?.subject || 'No Subject'}
                            </Text>
                            {processedEmail.fromCache && (
                              <Badge title="Cached" color="info" />
                            )}
                          </Flex>
                          
                          <Flex direction="row" style={{ flexWrap: 'wrap', gap: '16px' }}>
                            <Card 
                              padding="16" 
                              background="neutral-weak" 
                              radius="l" 
                              direction="column"
                              gap="8"
                              style={{ 
                                flex: '1 1 calc(33% - 16px)', 
                                minWidth: '250px', 
                                marginBottom: '16px' 
                              }}
                            >
                              <Text variant="label-strong-s">Category</Text>
                              <Chip 
                                label={processedEmail.category || 'Uncategorized'}
                                color="brand"
                              />
                            </Card>
                            
                            <Card 
                              padding="16" 
                              background="neutral-weak" 
                              radius="l" 
                              direction="column"
                              gap="8"
                              style={{ 
                                flex: '1 1 calc(33% - 16px)', 
                                minWidth: '250px', 
                                marginBottom: '16px'
                              }}
                            >
                              <Text variant="label-strong-s">Priority</Text>
                              <Chip 
                                label={processedEmail.priority || 'Medium'}
                                color={priorityColor}
                              />
                              {processedEmail.priorityExplanation && (
                                <Text variant="label-default-xs" marginTop="4">
                                  {processedEmail.priorityExplanation}
                                </Text>
                              )}
                            </Card>
                            
                            <Card 
                              padding="16" 
                              background="neutral-weak" 
                              radius="l" 
                              direction="column"
                              gap="8"
                              style={{ 
                                flex: '1 1 calc(33% - 16px)', 
                                minWidth: '250px'
                              }}
                            >
                              <Text variant="label-strong-s">Processing</Text>
                              <Text variant="body-default-xs">
                                {processedEmail.processingTime 
                                  ? `${processedEmail.processingTime} ms` 
                                  : 'N/A'}
                              </Text>
                            </Card>
                          </Flex>
                          
                          <Card 
                            padding="16" 
                            background="neutral-weak" 
                            radius="l" 
                            direction="column"
                            gap="8"
                            fill
                          >
                            <Text variant="label-strong-s">Summary</Text>
                            <Text variant="body-default-m">
                              {processedEmail.summary || 'No summary available'}
                            </Text>
                          </Card>
                          
                          <Flex direction="row" horizontal="end" gap="8" style={{ flexWrap: 'wrap' }}>
                            <Button
                              size="s"
                              variant="tertiary"
                              prefixIcon="refresh"
                              label="Reanalyze"
                              onClick={() => {
                                if (email) {
                                  handleAnalyzeEmail(email);
                                }
                              }}
                            />
                            <Button
                              size="s"
                              variant="secondary"
                              prefixIcon="eye"
                              label="View Original"
                              onClick={() => {
                                // This would typically navigate to the email
                                console.log("View original email:", processedEmail.id);
                              }}
                            />
                          </Flex>
                        </Column>
                      </Row>
                      {index < getProcessedEmailsArray().length - 1 && <Line color="neutral-alpha-weak" />}
                    </React.Fragment>
                  );
                })}
              </Column>
            )}
          </Column>
        )}
      </Card>
    </Column>
  );
}

