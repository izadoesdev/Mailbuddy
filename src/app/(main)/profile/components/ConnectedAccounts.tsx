"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Card,
  Text,
  Button,
  Column,
  Row,
  Icon,
  Spinner,
} from "@/once-ui/components";
import { authClient } from "@/libs/auth/client";
import { createParser, useQueryState } from "nuqs";

// Define parsers for query params
const optionalStringParser = createParser({
  parse: (value) => value || null,
  serialize: (value) => value || "",
});

interface ConnectedAccountsProps {
  user: {
    id: string;
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

interface Account {
  id: string;
  providerId: string;
  providerName: string;
  createdAt: string;
  updatedAt: string;
  email?: string;
}

export default function ConnectedAccounts({ user }: ConnectedAccountsProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLinking, setIsLinking] = useState(false);
  const [linkingProvider, setLinkingProvider] = useState<string | null>(null);
  
  // Use nuqs for link_status parameter with proper parsers
  const [linkStatus, setLinkStatus] = useQueryState("link_status", optionalStringParser);
  const [linkError, setLinkError] = useQueryState("link_error", optionalStringParser);

  // Load user's connected accounts
  const loadAccounts = useCallback(async () => {
    try {
      setIsLoading(true);
      const accountList = await authClient.listAccounts();
      // Transform the account list to match our interface
      const formattedAccounts = Array.isArray(accountList) ? accountList.map(acct => ({
        id: acct.id || acct.accountId || "",
        providerId: acct.provider || "",
        providerName: acct.provider || "",
        createdAt: acct.createdAt ? new Date(acct.createdAt).toISOString() : new Date().toISOString(),
        updatedAt: acct.updatedAt ? new Date(acct.updatedAt).toISOString() : new Date().toISOString(),
        email: acct.email || undefined
      })) : [];
      
      setAccounts(formattedAccounts);
      setError(null);
    } catch (err) {
      console.error("Failed to load accounts:", err);
      setError("Failed to load connected accounts. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Check for OAuth callback in URL
  useEffect(() => {
    if (linkStatus === "success") {
      setError(null);
      loadAccounts();
      // Clear the URL params after processing
      setTimeout(() => {
        setLinkStatus(null);
        setLinkError(null);
      }, 5000);
    } else if (linkStatus === "error") {
      const errorMsg = linkError || "Failed to link account. Please try again.";
      setError(errorMsg);
      // Clear the URL params after processing
      setTimeout(() => {
        setLinkStatus(null);
        setLinkError(null);
      }, 5000);
    }
  }, [linkStatus, linkError, setLinkStatus, setLinkError, loadAccounts]);

  // Initial load of accounts
  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  // Available providers that can be linked
  const availableProviders = [
    { id: "google", name: "Google", icon: "google" }
  ] as const;

  // Coming soon providers
  const comingSoonProviders = [
    { id: "icloud", name: "iCloud", icon: "apple" },
    { id: "outlook", name: "Outlook", icon: "microsoft" }
  ];

  // Handle linking a new social account
  const handleLinkAccount = async (provider: "google") => {
    try {
      setIsLinking(true);
      setLinkingProvider(provider);
      
      // Generate callback URL based on current location
      const callbackURL = `${window.location.origin}/profile?tab=accounts`;
      
      // Start the linking process
      await authClient.linkSocial({
        provider,
        callbackURL,
      });
    } catch (err) {
      console.error(`Failed to link ${provider} account:`, err);
      setError(`Failed to link ${provider} account. Please try again.`);
      setIsLinking(false);
      setLinkingProvider(null);
    }
  };

  // Get a readable provider name
  const getProviderName = (providerId: string): string => {
    const provider = availableProviders.find(p => p.id === providerId);
    return provider?.name || providerId.charAt(0).toUpperCase() + providerId.slice(1);
  };

  // Get a provider icon
  const getProviderIcon = (providerId: string): string => {
    const provider = availableProviders.find(p => p.id === providerId);
    return provider?.icon || "link";
  };

  // Format date string
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  // Handle unlinking an account
  const handleUnlinkAccount = async (accountId: string, providerId: string) => {
    // Check if this is the only account - prevent unlinking if it's the only one
    if (accounts.length <= 1) {
      setError("You cannot unlink your only authentication method.");
      return;
    }

    try {
      setIsLoading(true);
      // This is placeholder - the actual implementation depends on your auth client
      // await authClient.unlinkAccount(accountId);
      
      // Update the local state after unlinking
      setAccounts(accounts.filter(account => account.id !== accountId));
      setError(null);
    } catch (err) {
      console.error("Failed to unlink account:", err);
      setError("Failed to unlink account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Loading state
  if (isLoading && accounts.length === 0) {
    return (
      <Column padding="l" gap="m" center fill>
        <Spinner size="m" />
      </Column>
    );
  }

  // Calculate which providers are not yet connected
  const connectedProviderIds = accounts.map(account => account.providerId);
  const availableToConnect = availableProviders.filter(
    provider => !connectedProviderIds.includes(provider.id)
  );

  return (
    <>
      <Column paddingX="24" paddingTop="24" fillWidth>
        <Text>
          Connect additional accounts to your profile for simplified sign-in. You can use any connected account to access your account.
        </Text>
        
        {/* Show success message when account is linked */}
        {linkStatus === "success" && (
          <Column 
            background="success-alpha-weak" 
            padding="m" 
            radius="l" 
            border="success-alpha-medium"
          >
            <Text color="success">Account successfully linked!</Text>
          </Column>
        )}
        
        {error && (
          <Column 
            background="danger-alpha-weak" 
            padding="m" 
            radius="l" 
            border="danger-alpha-medium"
          >
            <Text color="danger">{error}</Text>
          </Column>
        )}
      
        
        {/* List of connected accounts */}
        {accounts.length > 0 ? (
          <Column fillWidth>
            {accounts.map(account => (
              <Row 
                key={account.id} 
                horizontal="space-between" 
                vertical="center" 
                padding="m"
                border="neutral-alpha-medium"
                radius="m"
              >
                <Row gap="m" vertical="center">
                  <Icon name={getProviderIcon(account.providerId)} size="m" />
                  <Column gap="xs">
                    <Text variant="body-strong-m">{getProviderName(account.providerId)}</Text>
                    <Text variant="body-default-s" onBackground="neutral-weak">
                      {account.email || user.email || "No email associated"}
                    </Text>
                    <Text variant="body-default-xs" onBackground="neutral-weak">
                      Connected on {formatDate(account.createdAt)}
                    </Text>
                  </Column>
                </Row>
                
                <Button
                  variant="danger"
                  size="s"
                  prefixIcon="trash"
                  disabled={accounts.length <= 1} // Prevent unlinking the only account
                  onClick={() => handleUnlinkAccount(account.id, account.providerId)}
                />
              </Row>
            ))}
          </Column>
        ) : (
          <></>
        )}
      </Column>
      
      {/* Available accounts to connect */}
      {availableToConnect.length > 0 && (
          <Column paddingX="24" fillWidth>
            <Column fillWidth border="neutral-alpha-medium" radius="l" overflow="hidden">
              {availableToConnect.map(provider => (
                <Row 
                  borderBottom="neutral-alpha-medium"
                  key={provider.id} 
                  horizontal="space-between" 
                  vertical="center" 
                  padding="24"
                >
                  <Row gap="m" vertical="center">
                    <Icon name={provider.icon} size="m" />
                    <Text variant="body-strong-m">{provider.name}</Text>
                  </Row>
                  
                  <Button
                    variant="primary"
                    size="s"
                    label={isLinking && linkingProvider === provider.id ? "Connecting" : "Connect"}
                    disabled={isLinking}
                    loading={isLinking && linkingProvider === provider.id}
                    onClick={() => handleLinkAccount(provider.id as "google")}
                  />
                </Row>
              ))}
              
              {/* Coming soon providers */}
              {comingSoonProviders.map((provider, index) => (
                <Row 
                  key={provider.id} 
                  horizontal="space-between" 
                  vertical="center" 
                  padding="24"
                  background="surface"
                  borderBottom={index === 0 ? "neutral-alpha-medium" : undefined}
                >
                  <Row gap="m" vertical="center">
                    <Icon name={provider.icon} size="m" />
                    <Column gap="2">
                      <Text variant="body-strong-m">{provider.name}</Text>
                    </Column>
                  </Row>
                  
                  <Button
                    variant="secondary"
                    size="s"
                    label="Coming Soon"
                    prefixIcon="clock"
                    disabled={true}
                  />
                </Row>
              ))}
            </Column>
          </Column>
      )}

      {/* Show coming soon providers even if no available providers */}
      {availableToConnect.length === 0 && (
          <Column padding="l" gap="l">
            <Text variant="heading-default-s">Coming Soon</Text>
            <Text onBackground="neutral-weak">
              We're working on adding more connection options for your account.
            </Text>
            
            <Column gap="m" fillWidth>
              {comingSoonProviders.map(provider => (
                <Row 
                  key={provider.id} 
                  horizontal="space-between" 
                  vertical="center" 
                  padding="m"
                  border="neutral-alpha-medium"
                  radius="l"
                >
                  <Row gap="m" vertical="center">
                    <Icon name={provider.icon} size="m" />
                    <Column gap="2">
                      <Text variant="body-strong-m">{provider.name}</Text>
                    </Column>
                  </Row>
                  
                  <Button
                    variant="secondary"
                    size="s"
                    label="Coming Soon"
                    prefixIcon="clock"
                    disabled={true}
                  />
                </Row>
              ))}
            </Column>
          </Column>
      )}
    </>
  );
} 