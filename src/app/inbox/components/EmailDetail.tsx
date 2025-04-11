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
} from "@/once-ui/components";
import type { Email } from "../types";
import { extractName, getInitials, formatDate } from "../utils";
import DOMPurify from "dompurify";

interface EmailDetailProps {
    email: Email;
    onClose: () => void;
    onToggleStar?: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailDetail({ email, onClose, onToggleStar }: EmailDetailProps) {
    const senderName = extractName(email.from ?? "");

    const handleStarClick = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (onToggleStar) {
            onToggleStar(email, e);
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
        <Column fill radius="xl" border="neutral-alpha-medium" overflow="hidden">
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
                    <IconButton
                        tooltip="Close"
                        tooltipPosition="left"
                        variant="ghost"
                        icon="close"
                        onClick={onClose}
                    />
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
                    <Column paddingX="24" gap="12">
                        <Row fill padding="16" radius="l" border="neutral-alpha-medium">
                            <Column gap="12">
                                <Row horizontal="space-between" vertical="center">
                                    <Heading variant="heading-strong-s">
                                        <Row gap="8" vertical="center">
                                            <span>✨ AI Analysis</span>
                                        </Row>
                                    </Heading>
                                </Row>

                                <Line />

                                {email.aiMetadata.summary && (
                                    <Column gap="4">
                                        <Text variant="body-strong-s">Summary:</Text>
                                        <Text variant="body-default-m">
                                            {email.aiMetadata.summary}
                                        </Text>
                                    </Column>
                                )}

                                <Row wrap gap="16">
                                    {email.aiMetadata.category && (
                                        <Column gap="4">
                                            <Text variant="body-strong-s">Category:</Text>
                                            <Tag label={email.aiMetadata.category} />
                                        </Column>
                                    )}

                                    {email.aiMetadata.priority && (
                                        <Column gap="4">
                                            <Text variant="body-strong-s">Priority:</Text>
                                            <Tag
                                                label={email.aiMetadata.priority}
                                                variant={
                                                    getPriorityColor(
                                                        email.aiMetadata.priority,
                                                    ) as any
                                                }
                                            />
                                        </Column>
                                    )}
                                </Row>

                                {email.aiMetadata.priorityExplanation && (
                                    <Column gap="4">
                                        <Text variant="body-strong-s">Reasoning:</Text>
                                        <Text variant="body-default-s">{email.aiMetadata.priorityExplanation}</Text>
                                    </Column>
                                )}
                                
                                {email.aiMetadata.keywords && email.aiMetadata.keywords.length > 0 && (
                                    <Column gap="4">
                                        <Text variant="body-strong-s">Key Points:</Text>
                                        <Row gap="4" wrap>
                                            {email.aiMetadata.keywords.map((keyword: string) => (
                                                <Chip key={`keyword-${keyword}`} label={keyword} />
                                            ))}
                                        </Row>
                                    </Column>
                                )}
                            </Column>
                        </Row>
                    </Column>
                )}

                <Row fillWidth fitHeight paddingX="8">
                    <div
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
                >
                    <Button variant="secondary" label="Forward" prefixIcon="arrowRight" />
                    <Button label="Reply" prefixIcon="reply" />
                </Row>
            </Column>
        </Column>
    );
}
