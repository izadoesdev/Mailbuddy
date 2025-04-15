import type React from "react";
import {
    Text,
    Row,
    Column,
    IconButton,
    Avatar,
    Button,
    Heading,
    Tag,
    Icon,
} from "@/once-ui/components";
import type { Email, Thread } from "../types";
import { extractName, getInitials, formatDate } from "../utils";
import DOMPurify from "dompurify";

interface EmailDetailProps {
    email: Email;
    thread?: Thread | null;
    onClose: () => void;
    onToggleStar?: (item: Email | Thread, e?: React.MouseEvent<HTMLButtonElement>) => void;
    onReply?: (email: Email) => void;
    onForward?: (email: Email) => void;
    onTrash?: (email: Email) => void;
    onSelectEmail?: (email: Email) => void;
}

/**
 * Decodes HTML entities in a string
 * @param html String with potential HTML entities
 * @returns Decoded string
 */
function decodeHtmlEntities(html: string): string {
    if (!html) return "";
    
    // Create a temporary DOM element
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    // Get the decoded text
    return txt.value;
}

export function EmailDetail({ 
    email, 
    thread,
    onClose, 
    onToggleStar,
    onReply,
    onForward,
    onTrash,
    onSelectEmail
}: EmailDetailProps) {
    // Use fromName if available, otherwise extract from the from field
    const senderName = (email as any).fromName || extractName(email.from ?? "");
    // Use fromEmail if available
    const senderEmail = (email as any).fromEmail || email.from;
    
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

    const handleEmailSelect = (emailToSelect: Email) => {
        if (onSelectEmail) {
            onSelectEmail(emailToSelect);
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

    // Check if we have other emails in this thread
    const hasMultipleEmails = thread?.emails?.length && thread.emails.length > 1;

    return (
        <Column fill radius="m" border="neutral-alpha-medium" background="overlay" overflow="hidden">
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
                        {hasMultipleEmails && (
                            <Row vertical="center" gap="4">
                                <Icon name="chat" size="s" onBackground="brand-medium" />
                                <Tag 
                                    variant="brand"
                                    label={`${thread?.emails?.length || 0} emails in thread`}
                                />
                            </Row>
                        )}
                    </Row>
                    <Row gap="8">
                        {onReply && (
                            <IconButton
                                tooltip="Reply"
                                tooltipPosition="bottom"
                                variant="ghost"
                                icon="reply"
                                onClick={handleReplyClick}
                            />
                        )}
                        {onForward && (
                            <IconButton
                                tooltip="Forward"
                                tooltipPosition="bottom"
                                variant="ghost"
                                icon="forward"
                                onClick={handleForwardClick}
                            />
                        )}
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
                
                {/* Thread emails list if we have multiple emails */}
                {hasMultipleEmails && (
                    <Column fillWidth paddingX="16" paddingY="8" gap="8" borderBottom="neutral-alpha-medium">
                        <Row fillWidth horizontal="space-between" paddingX="8" vertical="center">
                            <Row vertical="center" gap="4">
                                <Icon name="chat" size="s" onBackground="brand-medium" />
                                <Text variant="body-strong-s">Emails in this thread</Text>
                            </Row>
                            <Tag 
                                variant="brand"
                                label={`${thread?.emails?.length} total`}
                            />
                        </Row>
                        <Column fillWidth gap="4" style={{ maxHeight: "200px" }} overflowY="auto">
                            {thread?.emails?.map((threadEmail, index) => (
                                <Row 
                                    key={threadEmail.id}
                                    fillWidth
                                    paddingX="8"
                                    paddingY="4"
                                    radius="s"
                                    background={threadEmail.id === email.id ? "neutral-alpha-medium" : "transparent"}
                                    cursor="pointer"
                                    onClick={() => handleEmailSelect(threadEmail)}
                                >
                                    <Column fillWidth gap="2">
                                        <Row fillWidth horizontal="space-between">
                                            <Row gap="4" vertical="center">
                                                <Text 
                                                    variant="label-default-xs" 
                                                    onBackground="neutral-weak"
                                                >
                                                    #{index + 1}
                                                </Text>
                                                <Text 
                                                    variant={threadEmail.isRead ? "body-default-s" : "body-strong-s"}
                                                    style={{ 
                                                        maxWidth: "70%",
                                                        overflow: "hidden",
                                                        textOverflow: "ellipsis",
                                                        whiteSpace: "nowrap" 
                                                    }}
                                                >
                                                    {extractName(threadEmail.from || "")}
                                                </Text>
                                            </Row>
                                            <Text variant="label-default-xs" onBackground="neutral-weak">
                                                {formatDate(
                                                    threadEmail.internalDate
                                                        ? new Date(Number.parseInt(threadEmail.internalDate))
                                                        : new Date(threadEmail.createdAt)
                                                )}
                                            </Text>
                                        </Row>
                                        <Text 
                                            variant="body-default-xs" 
                                            onBackground="neutral-weak"
                                            style={{ 
                                                overflow: "hidden",
                                                textOverflow: "ellipsis",
                                                whiteSpace: "nowrap" 
                                            }}
                                        >
                                            {threadEmail.snippet || "No preview available"}
                                        </Text>
                                    </Column>
                                </Row>
                            ))}
                        </Column>
                    </Column>
                )}

                <Column fill overflowY="auto" paddingY="12" gap="16">
                <Row gap="16" vertical="center" paddingX="24" fillWidth fitHeight>
                    <Avatar size="l" value={getInitials(senderName)} />
                    <Column gap="4">
                        <Text variant="body-strong-m">{senderName}</Text>
                        <Text variant="body-default-s" onBackground="neutral-weak">
                            {senderEmail}
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
                        {formatDate(
                            email.internalDate
                                ? new Date(Number.parseInt(email.internalDate))
                                : new Date(email.createdAt)
                        )}
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

                {/* AI Metadata Card - With TiltFx effect */}
                {email.aiMetadata && (
                    <Column fillWidth paddingX="24" gap="8">
                            <Column 
                                fillWidth 
                                radius="l" 
                                border="brand-alpha-medium" 
                                background="brand-alpha-weak" 
                                padding="16"
                                gap="12"
                                position="relative"
                            >
                                <Icon 
                                    radius="full" 
                                    padding="8" 
                                    solid="brand-medium" 
                                    position="absolute" 
                                    right="16" 
                                    top="16" 
                                    onSolid="brand-strong" 
                                    name="sparkles" 
                                    size="xs" 
                                />
                                
                                {/* AI Insights Header */}
                                <Heading variant="heading-strong-s" color="brand">
                                    AI Insights
                                </Heading>
                                
                                {/* Category and Priority in a single row */}
                                <Row gap="8" wrap>
                                    {email.aiMetadata.category && (
                                        <Tag 
                                            label={`Category: ${email.aiMetadata.category}`}
                                            variant={getPriorityColor(email.aiMetadata.priority || undefined) as any}
                                        />
                                    )}
                                    
                                    {email.aiMetadata.priority && (
                                        <Tag 
                                            label={`Priority: ${email.aiMetadata.priority}`}
                                            variant={getPriorityColor(email.aiMetadata.priority) as any}
                                        />
                                    )}
                                </Row>

                                {/* Summary */}
                                {email.aiMetadata.summary && (
                                    <Column fillWidth
                                        gap="4"
                                    >
                                        <Text variant="label-default-s" onBackground="neutral-weak">
                                            Summary
                                        </Text>
                                        {/* Priority Explanation - only if exists */}
                                        {email.aiMetadata.priorityExplanation && (
                                            <Row 
                                                gap="8" 
                                                vertical="center" 
                                                padding="8"
                                                radius="xl"
                                                background="brand-alpha-weak"
                                                marginBottom="4"
                                            >
                                                <Icon onBackground="brand-medium" size="s" name="infoCircle"/>
                                                <Text onBackground="brand-strong" variant="body-default-s">
                                                    {email.aiMetadata.priorityExplanation}
                                                </Text>
                                            </Row>
                                        )}
                                        <Text variant="body-default-s">
                                            {email.aiMetadata.summary}
                                        </Text>
                                    </Column>
                                )}

                                {/* Key Points */}
                                {email.aiMetadata.keywords && email.aiMetadata.keywords.length > 0 && (
                                    <Column gap="4" fillWidth>
                                        <Text variant="label-default-s" onBackground="neutral-weak">
                                            Key Points
                                        </Text>
                                        <Column gap="4" fillWidth>
                                            {email.aiMetadata.keywords.map((keyword: string) => (
                                                <Row 
                                                    key={`keyword-${keyword}`} 
                                                    gap="8" 
                                                    vertical="center"
                                                    padding="8"
                                                    radius="xl"
                                                    background="brand-alpha-weak"
                                                >
                                                    <Icon name="checkCircle" size="s" onBackground="brand-medium" />
                                                    <Text variant="body-default-s">{keyword}</Text>
                                                </Row>
                                            ))}
                                        </Column>
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
                            __html: DOMPurify.sanitize(email.body || decodeHtmlEntities(email.snippet || "")),
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
