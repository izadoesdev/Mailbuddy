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
} from "@/once-ui/components";
import { signOut } from "@/libs/auth/client";
import { useRouter } from "next/navigation";

interface Email {
  id: string;
  subject: string;
  from: string;
  to: string;
  snippet: string;
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
  const [emails, setEmails] = useState<Email[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const [newEmailsCount, setNewEmailsCount] = useState(0);
  const [stats, setStats] = useState<EmailResponse['stats'] | null>(null);
  const { addToast } = useToast();
  const router = useRouter();

  const fetchEmails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAuthError(false);
      setStats(null);
      
      const result = await getEmails();
      
      if (result.error) {
        setError(result.error);
        
        // Check if it's an authentication error
        if (result.error.includes("Authentication failed") || 
            result.error.includes("Access token not available")) {
          setIsAuthError(true);
        }
        
        addToast({
          variant: "danger",
          message: result.error,
        });
        return;
      }
      
      setEmails(result.messages || []);
      setNewEmailsCount(result.newEmailsCount || 0);
      setStats(result.stats || null);
      
      if (result.newEmailsCount && result.newEmailsCount > 0) {
        addToast({
          variant: "success",
          message: `Fetched ${result.newEmailsCount} new emails`,
        });
      }
    } catch (err) {
      setError("Failed to fetch emails");
      addToast({
        variant: "danger",
        message: "Failed to fetch emails",
      });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  // Only fetch once on initial mount
  useEffect(() => {
    fetchEmails();
  }, [fetchEmails]);

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
              label={loading ? "Refreshing..." : "Refresh Emails"}
              prefixIcon="refresh"
              onClick={fetchEmails}
              disabled={loading}
              variant="secondary"
            />
          </Row>
          
          {error && (
            <Row
              background="danger-weak"
              border="danger-alpha-medium"
              radius="l"
              padding="16"
              fillWidth
            >
              <Text onBackground="danger-strong">{error}</Text>
            </Row>
          )}
          
          {stats && (
            <Row
              background="overlay"
              border="neutral-alpha-weak"
              radius="l"
              padding="16"
              fillWidth
              gap="16"
              wrap
            >
              <Badge title={`Total: ${stats.totalEmails}`} color="neutral" />
              <Badge title={`New: ${stats.newEmails}`} color="brand" />
              <Badge title={`Existing: ${stats.existingEmails}`} color="neutral" />
              <Badge title={`Batches: ${stats.batchCount}`} color="neutral" />
              <Badge title={`Time: ${stats.fetchTime}ms`} color="neutral" />
            </Row>
          )}
          
          {loading ? (
            <Column gap="16" fillWidth horizontal="center" paddingY="32">
              <Spinner size="l" />
              <Text onBackground="neutral-medium">Loading emails...</Text>
            </Column>
          ) : (
            <Column gap="16" fillWidth>
              {emails.length === 0 ? (
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
                emails.map((email) => (
                  <Card
                    key={email.id}
                    background="overlay"
                    border="neutral-alpha-weak"
                    radius="l"
                    padding="16"
                    fillWidth
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
    </Column>
  );
} 