"use client";

import { useState, useEffect, useCallback } from "react";
import { getEmails } from "./actions/emails";
import {
  Column,
  Row,
  Heading,
  Text,
  Card,
  useToast,
  Background,
  Button,
  Spinner,
  Badge,
  Dialog,
  IconButton,
} from "@/once-ui/components";
import { signOut } from "@/libs/auth/client";
import { useRouter } from "next/navigation";
import { useEmails } from "@/libs/query/useEmails";

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
  body: string;
  isHtml: boolean;
  isRead: boolean;
  isStarred: boolean;
}

interface EmailResponse {
  messages?: Email[];
  newEmailsCount?: number;
  error?: string;
  stats?: {
    totalEmails: number;
    existingEmails: number;
    newEmails: number;
    fetchTime: number;
    batchCount: number;
  };
}

export default function TestPage() {
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const { addToast } = useToast();
  const router = useRouter();
  
  const { 
    data: emailData, 
    isLoading, 
    error: queryError, 
    refetch 
  } = useEmails();
  
  const [isAuthError, setIsAuthError] = useState(false);
  
  // Check for authentication errors
  useEffect(() => {
    if (queryError) {
      const errorMessage = typeof queryError === 'string' ? queryError : 'Failed to fetch emails';
      
      if (errorMessage.includes("Authentication failed") || 
          errorMessage.includes("Access token not available")) {
        setIsAuthError(true);
      }
      
      addToast({
        variant: "danger",
        message: errorMessage,
      });
    }
  }, [queryError, addToast]);

  // Ensure body scroll is restored when component unmounts
  useEffect(() => {
    return () => {
      document.body.style.overflow = "unset";
      document.body.childNodes.forEach((node) => {
        if (node instanceof HTMLElement) {
          node.inert = false;
        }
      });
    };
  }, []);

  const handleCloseDialog = () => {
    setSelectedEmail(null);
    // Ensure body scroll is restored
    document.body.style.overflow = "unset";
    document.body.childNodes.forEach((node) => {
      if (node instanceof HTMLElement) {
        node.inert = false;
      }
    });
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <Column fillWidth paddingY="32" paddingX="32" horizontal="center">
      <Column maxWidth="l" gap="16">
        <Heading variant="display-strong-xl">Your Emails</Heading>
        <Text variant="body-default-l" onBackground="neutral-medium">
          Here are your recent emails from Gmail.
        </Text>
      </Column>

      <Column
        overflow="hidden"
        as="main"
        maxWidth="l"
        position="relative"
        radius="xl"
        horizontal="center"
        border="neutral-alpha-weak"
        fillWidth
        marginTop="32"
      >
        <Column
          fillWidth
          horizontal="center"
          gap="32"
          radius="xl"
          paddingTop="32"
          position="relative"
        >
          <Background
            mask={{
              x: 0,
              y: 48,
            }}
            position="absolute"
            grid={{
              display: true,
              width: "0.25rem",
              color: "neutral-alpha-medium",
              height: "0.25rem",
            }}
          />
          
          <Row fillWidth horizontal="end" paddingX="16" gap="16">
            {isAuthError && (
              <Button
                label="Log Out"
                prefixIcon="log-out"
                onClick={handleLogout}
                variant="danger"
              />
            )}
            <Button
              label={isLoading ? "Refreshing..." : "Refresh Emails"}
              prefixIcon="refresh"
              onClick={() => refetch()}
              disabled={isLoading}
              variant="secondary"
            />
          </Row>
          
          {queryError && (
            <Row
              background="danger-weak"
              border="danger-alpha-medium"
              radius="l"
              padding="16"
              fillWidth
            >
              <Text onBackground="danger-strong">{typeof queryError === 'string' ? queryError : 'Failed to fetch emails'}</Text>
            </Row>
          )}
          
          {emailData?.stats && (
            <Row
              background="overlay"
              border="neutral-alpha-weak"
              radius="l"
              padding="16"
              fillWidth
              gap="16"
              wrap
            >
              <Badge title={`Total: ${emailData.stats.totalEmails}`} color="neutral" />
              <Badge title={`New: ${emailData.stats.newEmails}`} color="brand" />
              <Badge title={`Existing: ${emailData.stats.existingEmails}`} color="neutral" />
              <Badge title={`Time: ${emailData.stats.fetchTime}ms`} color="neutral" />
            </Row>
          )}
          
          {isLoading ? (
            <Column gap="16" fillWidth horizontal="center" paddingY="32">
              <Spinner size="l" />
              <Text onBackground="neutral-medium">Loading emails...</Text>
            </Column>
          ) : (
            <Column gap="16" fillWidth>
              {!emailData?.messages || emailData.messages.length === 0 ? (
                <Row
                  background="overlay"
                  border="neutral-alpha-weak"
                  radius="l"
                  padding="32"
                  fillWidth
                  horizontal="center"
                >
                  <Text onBackground="neutral-medium">No emails found</Text>
                </Row>
              ) : (
                emailData.messages.map((email) => (
                  <Card
                    key={email.id}
                    background="overlay"
                    border="neutral-alpha-weak"
                    radius="l"
                    padding="16"
                    fillWidth
                    onClick={() => setSelectedEmail(email)}
                    style={{ cursor: 'pointer' }}
                  >
                    <Column gap="8">
                      <Heading variant="heading-strong-m">{email.subject || "No Subject"}</Heading>
                      <Row gap="16">
                        <Text onBackground="neutral-medium">From: {email.from || "Unknown"}</Text>
                        {email.isRead ? (
                          <Text onBackground="neutral-weak">Read</Text>
                        ) : (
                          <Text onBackground="brand-medium">Unread</Text>
                        )}
                      </Row>
                      <Text onBackground="neutral-medium">{email.snippet || "No preview available"}</Text>
                    </Column>
                  </Card>
                ))
              )}
            </Column>
          )}
        </Column>
      </Column>

      {selectedEmail && (
        <Dialog
          isOpen={!!selectedEmail}
          onClose={handleCloseDialog}
          title={selectedEmail.subject || "No Subject"}
          base={false}
          footer={
            <Row horizontal="end" gap="8">
              <Button 
                label="Close" 
                onClick={handleCloseDialog} 
                variant="secondary" 
              />
            </Row>
          }
        >
          <Column gap="16" fillWidth>
            <Row gap="16" wrap>
              <Text onBackground="neutral-medium">From: {selectedEmail.from || "Unknown"}</Text>
              <Text onBackground="neutral-medium">To: {selectedEmail.to || "Unknown"}</Text>
            </Row>
            <Row gap="16" wrap>
              {selectedEmail.isRead ? (
                <Badge title="Read" color="neutral" />
              ) : (
                <Badge title="Unread" color="brand" />
              )}
              {selectedEmail.isStarred && (
                <Badge title="Starred" color="warning" />
              )}
            </Row>
            <Card
              background="overlay"
              border="neutral-alpha-weak"
              radius="l"
              padding="16"
              fillWidth
            >
              <div 
                dangerouslySetInnerHTML={{ __html: selectedEmail.body }} 
                style={{ 
                  fontFamily: 'var(--font-primary)',
                  lineHeight: '1.6',
                  fontSize: '1rem',
                  overflowWrap: 'break-word',
                  wordBreak: 'break-word'
                }}
                className="email-content"
              />
            </Card>
          </Column>
        </Dialog>
      )}
    </Column>
  );
} 