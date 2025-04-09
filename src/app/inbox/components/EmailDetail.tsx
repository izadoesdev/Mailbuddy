import React from "react";
import {
  Text,
  Row,
  Column,
  Chip,
  Line,
  IconButton,
  Avatar,
  Card,
  Button,
  Heading,
} from "@/once-ui/components";
import { Email } from "../types";
import { extractName, getInitials, formatDate } from "../utils";
import DOMPurify from 'dompurify';

interface EmailDetailProps {
  email: Email;
  onClose: () => void;
  onToggleStar?: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailDetail({ email, onClose, onToggleStar }: EmailDetailProps) {
  const senderName = extractName(email.from);
  
  const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (onToggleStar) {
      onToggleStar(email, e);
    }
  };
  
  return (
    <Card fillWidth padding="24">
      <Column gap="24">
        <Row horizontal="space-between" vertical="center">
          <Row gap="8" vertical="center">
            <Heading>{email.subject}</Heading>
            <IconButton
              variant="ghost"
              size="s"
              icon={email.isStarred ? "starFill" : "star"}
              color={email.isStarred ? "warning" : "neutral"}
              aria-label={email.isStarred ? "Unstar email" : "Star email"}
              onClick={handleStarClick}
            />
          </Row>
          <IconButton
            variant="ghost"
            icon="close"
            onClick={onClose}
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
              {email.from}
            </Text>
            <Text variant="label-default-s" onBackground="neutral-weak">
              To: {email.to || 'me'}
            </Text>
          </Column>
          <Text variant="label-default-s" onBackground="neutral-weak" style={{ marginLeft: 'auto' }}>
            {formatDate(email.createdAt)}
          </Text>
        </Row>
        
        {email.labels?.length > 0 && (
          <Row gap="8" wrap>
            {email.labels
              .filter((label: string) => !['UNREAD', 'INBOX'].includes(label))
              .map((label: string) => (
                <Chip 
                  key={label} 
                  label={label.replace('CATEGORY_', '')}
                />
              ))}
          </Row>
        )}
        
        <Line />
        
        <div 
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(email.body || email.snippet || '') }}
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
} 