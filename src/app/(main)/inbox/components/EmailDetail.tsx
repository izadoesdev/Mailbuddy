import type React from "react";
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
    Tag,
    Icon,
} from "@/once-ui/components";
import type { Email } from "../types";
import { extractName, getInitials, formatDate } from "../utils";
import DOMPurify from "dompurify";
import { useState } from "react";

interface EmailDetailProps {
    email: Email;
    onClose: () => void;
    onToggleStar?: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
    onReply?: (email: Email) => void;
    onForward?: (email: Email) => void;
    onTrash?: (email: Email) => void;
}

export function EmailDetail({ 
    email, 
    onClose, 
    onToggleStar,
    onReply,
    onForward,
    onTrash 
}: EmailDetailProps) {
    const senderName = extractName(email.from ?? "");
    
    const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onToggleStar) {
            onToggleStar(email, e);
        }
    };

    const handleReplyClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onReply) {
            onReply(email);
        }
    };

    const handleForwardClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onForward) {
            onForward(email);
        }
    };

    const handleTrashClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onTrash) {
            onTrash(email);
        }
    };

    // Helper function to get the appropriate color for priority
    const getPriorityColor = (priority?: string) => {
        if (!priority) return "neutral";
        switch (priority.toLowerCase()) {
            case "urgent":
                return "error";
            case "high":
                return "warning";
            case "medium":
                return "info";
            case "low":
                return "success";
            default:
                return "neutral";
        }
    };

    return (
        <Column fill radius="m" border="neutral-alpha-medium" overflow="hidden">
            <Column fill>
                <Row
                    horizontal="space-between"
                    vertical="center"
                    paddingY="12"
                    paddingX="24"
                    borderBottom="neutral-alpha-medium"
                >
                    <Row gap="12" vertical="center">
                        <Heading variant="heading-strong-m">{email.subject}</Heading>
                        <IconButton
                            variant="ghost"
                            size="s"
                            icon={email.isStarred ? "starFill" : "star"}
                            color={email.isStarred ? "warning" : "neutral"}
                            aria-label={email.isStarred ? "Unstar email" : "Star email"}
                            onClick={handleStarClick}
                        />
                    </Row>
                    <Row gap="8">
                        {onTrash && (
                            <IconButton
                                tooltip="Move to trash"
                                tooltipPosition="bottom"
                                variant="ghost"
                                icon="trash"
                                color="danger"
                                onClick={handleTrashClick}
                            />
                        )}
                        <IconButton
                            tooltip="Close"
                            tooltipPosition="left"
                            variant="ghost"
                            icon="close"
                            onClick={onClose}
                        />
                    </Row>
                </Row>
                <Column fill overflowY="auto" paddingY="12" gap="16">
                <Row gap="16" vertical="center" paddingX="24" fillWidth fitHeight>
                    <Avatar size="l" value={getInitials(senderName)} />
                    <Column gap="4">
                        <Text variant="body-strong-m">{senderName}</Text>
                        <Text variant="body-default-s" onBackground="neutral-weak">
                            {email.from}
                        </Text>
                        <Text variant="label-default-s" onBackground="neutral-weak">
                            To: {email.to || "me"}
                        </Text>
                    </Column>
                    <Text
                        variant="label-default-s"
                        onBackground="neutral-weak"
                        style={{ marginLeft: "auto" }}
                    >
                        {formatDate(email.createdAt)}
                    </Text>
                </Row>

                {email.labels?.length > 0 && (
                    <Row gap="8" wrap paddingY="12" paddingX="24">
                        {email.labels
                            .filter((label: string) => !["UNREAD", "INBOX"].includes(label))
                            .map((label: string) => (
                                <Tag size="m" key={label} label={label.replace("CATEGORY_", "")} />
                            ))}
                    </Row>
                )}

                {/* AI Metadata Card */}
                {email.aiMetadata && (
                    <Column fillWidth paddingX="24" gap="12">
                            <Column fillWidth radius="l" border="neutral-alpha-medium" background="neutral-alpha-weak" paddingBottom="16">
                                <Row gap="8" paddingX="8" paddingY="8">
                                    {email.aiMetadata.category && (
                                        <Column width={8} border="neutral-alpha-medium" radius="m" paddingX="12" paddingY="8" gap="4" background={getPriorityColor(
                                            email.aiMetadata.priority ?? undefined,
                                        ) as any}>
                                            <Text variant="label-default-s" onBackground="neutral-weak">Category</Text>
                                            <Text variant="label-strong-s">{email.aiMetadata.category}</Text>
                                        </Column>
                                    )}

                                    {email.aiMetadata.priority && (
                                        <Column width={8} border="neutral-alpha-medium" radius="m" paddingX="12" paddingY="8" gap="4" background={getPriorityColor(
                                            email.aiMetadata.priority,
                                        ) as any}>
                                            <Text variant="label-default-s" onBackground="neutral-weak">Priority</Text>
                                            <Text variant="label-strong-s">{email.aiMetadata.priority}</Text>
                                        </Column>
                                    )}
                                </Row>

                                <Icon radius="full" padding="8" solid="brand-medium" position="absolute" right="16" top="16" onSolid="brand-strong" name="sparkles" size="xs" />

                                {email.aiMetadata.summary && (
                                    <Column gap="4" paddingX="16" paddingTop="8">
                                        <Text variant="label-default-s" onBackground="neutral-weak">Summary</Text>
                                        <Text variant="body-default-m">
                                            {email.aiMetadata.summary}
                                        </Text>
                                    </Column>
                                )}

                                {email.aiMetadata.priorityExplanation && (
                                    <Row gap="8" paddingX="16" paddingTop="16">
                                        <Icon onBackground="neutral-weak" size="xs" name="infoCircle"/><Text onBackground="neutral-medium" variant="label-default-s">{email.aiMetadata.priorityExplanation}</Text>
                                    </Row>
                                )}
                                
                                {email.aiMetadata.keywords && email.aiMetadata.keywords.length > 0 && (
                                    <Column gap="4">
                                        <Text variant="body-strong-s">Key Points:</Text>
                                        <ul>
                                            {email.aiMetadata.keywords.map((keyword: string) => (
                                                <li key={`keyword-${keyword}`}>{keyword}</li>
                                            ))}
                                        </ul>
                                    </Column>
                                )}
                            </Column>
                    </Column>
                )}

                <Row fillWidth fitHeight paddingX="8">
                    <style>{`
                        .email-body a {
                            color: blue;
                            text-decoration: underline;
                            font-weight: 500;
                        }
                        .email-body a:hover {
                            color: inherit;
                        }
                        .email-body li {
                            &::marker {
                                color: inherit;
                            }
                        }
                    `}</style>
                    <div
                        className="email-body"
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(email.body || email.snippet || ""),
                        }}
                        style={{ width: "100%", height: "100%", borderRadius: "12px", background: "var(--static-white)", padding: "var(--static-space-20)", color: "var(--static-black)" }}
                    />
                </Row>
                </Column>

                <Row
                    gap="8"
                    horizontal="end"
                    borderTop="neutral-alpha-medium"
                    paddingY="8"
                    paddingX="16"
                    data-border="rounded"
                >
                    <Row gap="8" maxWidth={12.5}>
                        <Button 
                            fillWidth
                            variant="secondary" 
                            label="Forward" 
                            prefixIcon="arrowRight" 
                            onClick={handleForwardClick}
                        />
                        <Button 
                            fillWidth
                            label="Reply" 
                            prefixIcon="reply" 
                            onClick={handleReplyClick}
                        />
                    </Row>
                </Row>
            </Column>
        </Column>
    );
}
