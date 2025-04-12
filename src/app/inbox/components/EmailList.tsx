import type React from "react";
import { Column, Text, Skeleton, Icon, Line } from "@/once-ui/components";
import type { Email } from "../types";
import { EmailItem } from "./EmailItem";

interface EmailListProps {
    emails: Email[];
    isLoading: boolean;
    selectedEmailId: string | null;
    searchQuery: string;
    onSelectEmail: (email: Email) => void;
    onToggleStar: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
    onTrash?: (email: Email) => void;
}

export function EmailList({
    emails,
    isLoading,
    selectedEmailId,
    searchQuery,
    onSelectEmail,
    onToggleStar,
    onTrash,
}: EmailListProps) {
    // If loading, show skeletons
    if (isLoading) {
        return (
            <Column fill gap="1" border="neutral-alpha-medium" overflow="hidden" bottomRadius="m">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <Skeleton key={i} shape="block" style={{ height: "5rem" }} />
                ))}
            </Column>
        );
    }

    // If no emails, show empty state
    if (emails.length === 0) {
        return (
            <Column fill center padding="64" horizontal="center" vertical="center" gap="16" border="neutral-alpha-medium" bottomRadius="m">
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

    // Render list of emails
    return (
        <Column fill overflow="hidden" bottomRadius="m" border="neutral-alpha-medium">
            <Column fill overflowY="auto">
                {emails.map((email, index) => (
                    <Column fillWidth key={email.id}>
                        <EmailItem
                            email={email}
                            index={index}
                            isSelected={selectedEmailId === email.id}
                            totalEmails={emails.length}
                            onSelect={onSelectEmail}
                            onToggleStar={onToggleStar}
                            onTrash={onTrash}
                        />
                    </Column>
                ))}
            </Column>
        </Column>
    );
}
