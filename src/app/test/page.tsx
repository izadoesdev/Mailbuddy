"use client";

import { useState, useEffect } from "react";
import { getEmails } from "./actions/emails";
import {
  Column,
  Row,
  Heading,
  Text,
  Card,
  useToast,
  Background,
  Line,
  Button,
  Icon,
} from "@/once-ui/components";
import { signOut } from "@/libs/auth/client";
import { useRouter } from "next/navigation";

export default function TestPage() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);
  const { addToast } = useToast();
  const router = useRouter();

  const fetchEmails = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsAuthError(false);
      const result = await getEmails();
      
      if ('error' in result) {
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
  };

  // Only fetch once on initial mount
  useEffect(() => {
    fetchEmails();
  }, []);

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
          
          {loading ? (
            <Column gap="16" fillWidth>
              {[...Array(5)].map((_, i) => (
                <Row
                  key={i}
                  background="overlay"
                  border="neutral-alpha-weak"
                  radius="l"
                  padding="16"
                  fillWidth
                  height="80"
                />
              ))}
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
                      <Heading variant="heading-strong-m">Email ID: {email.id}</Heading>
                      <Text onBackground="neutral-medium">Thread ID: {email.threadId}</Text>
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