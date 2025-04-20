import { Button, Column, Icon, Text } from "@/once-ui/components";
import type React from "react";
import type { Thread } from "../types";
import { EmailItem } from "./EmailItem";
import { LoadingAtom } from "./LoadingAtom";

interface EmailListProps {
    threads: Thread[];
    isLoading: boolean;
    selectedThreadId: string | null;
    selectedEmailId: string | null;
    searchQuery: string;
    onSelectThread: (thread: Thread) => void;
    onToggleStar: (thread: Thread, e: React.MouseEvent<HTMLButtonElement>) => void;
    error?: string;
    errorType?: string;
    onErrorAction?: () => void;
}

export function EmailList({
    threads,
    isLoading,
    selectedThreadId,
    selectedEmailId,
    searchQuery,
    onSelectThread,
    onToggleStar,
    error,
    errorType,
    onErrorAction,
}: EmailListProps) {
    // If loading, show the atom loading animation with cycling messages
    if (isLoading) {
        return (
            <Column fill border="neutral-alpha-medium" overflow="hidden" bottomRadius="m">
                <LoadingAtom color="#32cd32" size="medium" />
            </Column>
        );
    }

    // If there's an error, show error state
    if (error) {
        return (
            <Column
                fill
                center
                padding="64"
                horizontal="center"
                vertical="center"
                gap="16"
                border="neutral-alpha-medium"
                bottomRadius="m"
            >
                <Icon
                    name={
                        errorType === "no_gmail_account"
                            ? "mail"
                            : errorType === "sync_in_progress"
                              ? "refresh"
                              : "alertCircle"
                    }
                    size="m"
                />
                <Text variant="heading-strong-m">{error}</Text>
                <Text variant="body-default-m" onBackground="neutral-weak">
                    {errorType === "no_gmail_account"
                        ? "Please connect your Gmail account to continue"
                        : errorType === "invalid_credentials"
                          ? "Your Gmail account needs to be reconnected"
                          : errorType === "no_emails_synced"
                            ? "No emails have been synced yet"
                            : errorType === "sync_in_progress"
                              ? "Email sync is in progress..."
                              : "There was a problem loading your emails"}
                </Text>
                {errorType !== "sync_in_progress" && onErrorAction && (
                    <Button variant="primary" onClick={onErrorAction}>
                        {errorType === "no_gmail_account"
                            ? "Connect Gmail"
                            : errorType === "invalid_credentials"
                              ? "Reconnect Gmail"
                              : errorType === "no_emails_synced"
                                ? "Sync Now"
                                : "Refresh"}
                    </Button>
                )}
            </Column>
        );
    }

    // If no threads, show empty state
    if (threads.length === 0) {
        return (
            <Column
                fill
                center
                padding="64"
                horizontal="center"
                vertical="center"
                gap="16"
                border="neutral-alpha-medium"
                bottomRadius="m"
            >
                <Icon name="inbox" size="m" />
                <Text variant="heading-strong-m">Your inbox is empty</Text>
                {searchQuery && (
                    <Text variant="body-default-m" onBackground="neutral-weak">
                        Try adjusting your search query
                    </Text>
                )}
            </Column>
        );
    }

    // Render list of threads
    return (
        <Column fill overflow="hidden" bottomRadius="m" border="neutral-alpha-medium">
            <Column fill overflowY="auto">
                {threads.map((thread, index) => (
                    <Column fillWidth key={thread.threadId}>
                        <EmailItem
                            email={thread}
                            index={index}
                            isSelected={selectedThreadId === thread.threadId}
                            totalEmails={threads.length}
                            onSelect={(item) => onSelectThread(item as Thread)}
                            onToggleStar={(item, e) => onToggleStar(item as Thread, e)}
                        />
                    </Column>
                ))}
            </Column>
        </Column>
    );
}
