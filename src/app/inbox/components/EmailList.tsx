import React from "react";
import {
  Column,
  Text,
  Skeleton,
  Icon,
} from "@/once-ui/components";
import { Email } from "../types";
import { EmailItem } from "./EmailItem";

interface EmailListProps {
  emails: Email[];
  isLoading: boolean;
  selectedEmailId: string | null;
  searchQuery: string;
  onSelectEmail: (email: Email) => void;
  onToggleStar: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailList({
  emails,
  isLoading,
  selectedEmailId,
  searchQuery,
  onSelectEmail,
  onToggleStar,
}: EmailListProps) {
  // If loading, show skeletons
  if (isLoading) {
    return (
      <Column padding="16" gap="16">
        {[1, 2, 3, 4, 5].map(i => (
          <Skeleton key={i} shape="block" style={{ height: '80px' }} />
        ))}
      </Column>
    );
  }

  // If no emails, show empty state
  if (emails.length === 0) {
    return (
      <Column padding="64" horizontal="center" vertical="center" gap="16">
        <Icon name="inbox" size="xl" />
        <Text variant="body-strong-l">No emails found</Text>
        <Text variant="body-default-m" onBackground="neutral-weak">
          {searchQuery ? "Try adjusting your search query" : "Your inbox is empty"}
        </Text>
      </Column>
    );
  }

  // Render list of emails
  return (
    <Column 
      fillWidth 
      gap="1" 
      overflow="auto" 
      style={{ maxHeight: 'calc(100vh - 200px)' }}
    >
      {emails.map((email, index) => (
        <EmailItem
          key={email.id}
          email={email}
          index={index}
          isSelected={selectedEmailId === email.id}
          totalEmails={emails.length}
          onSelect={onSelectEmail}
          onToggleStar={onToggleStar}
        />
      ))}
    </Column>
  );
} 