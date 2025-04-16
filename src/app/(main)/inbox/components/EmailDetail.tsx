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
    Dialog,
    useToast,
} from "@/once-ui/components";
import type { Email, Thread } from "../types";
import { extractName, getInitials, formatDate } from "../utils";
import DOMPurify from "dompurify";
import { useMemo, useState, useEffect } from "react";

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

/**
 * Detects if the email HTML content has any styling
 * @param html HTML content of the email
 * @returns boolean indicating if styling exists
 */
function hasEmailStyling(html: string): boolean {
    if (!html) return false;
    
    // Check for common style-related patterns
    const stylePatterns = [
        /<style[^>]*>/i,                   // Style tags
        /style=["'][^"']+["']/i,           // Inline style attributes
        /<font[^>]*>/i,                    // Font tags
        /<h[1-6][^>]*>/i,                  // Heading tags
        /<div[^>]*class=/i,                // Divs with classes
        /<table[^>]*>/i,                   // Tables (often used for layout)
        /<span[^>]*style=/i,               // Spans with styles
        /<p[^>]*style=/i,                  // Paragraphs with styles
        /<link[^>]*rel=["']stylesheet["']/i // External stylesheets
    ];
    
    // Return true if any of the patterns match
    return stylePatterns.some(pattern => pattern.test(html));
}

/**
 * Formats plain text email content for better display
 * @param content Plain text email content
 * @returns Formatted HTML content
 */
function formatPlainTextEmail(content: string): string {
    if (!content) return "";
    
    // Check if content is already HTML
    if (content.includes('<') && content.includes('>')) {
        return content;
    }
    
    // Format plain text by:
    // 1. Replace multiple consecutive line breaks with paragraph breaks
    // 2. Replace single line breaks with <br>
    // 3. Convert URLs to actual links
    // 4. Preserve indentation and spacing
    
    // Replace URLs with actual links
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    let formattedContent = content.replace(urlRegex, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Detect and format email addresses
    const emailRegex = /([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;
    formattedContent = formattedContent.replace(emailRegex, '<a href="mailto:$1">$1</a>');
    
    // Format paragraphs (multiple line breaks)
    formattedContent = formattedContent.replace(/\n{2,}/g, '</p><p>');
    
    // Format single line breaks
    formattedContent = formattedContent.replace(/\n/g, '<br />');
    
    // Wrap the whole content in paragraphs
    formattedContent = `<p>${formattedContent}</p>`;
    
    // Format potential lists (lines starting with - or * or numbers)
    const listItemRegex = /<p>(\s*)[-*•]\s+(.+?)<\/p>/g;
    formattedContent = formattedContent.replace(listItemRegex, '<ul><li>$2</li></ul>');
    
    // Clean up multiple adjacent list tags
    formattedContent = formattedContent.replace(/<\/ul>\s*<ul>/g, '');
    
    return formattedContent;
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
    
    // Dialog state for trash confirmation
    const [isTrashDialogOpen, setIsTrashDialogOpen] = useState(false);
    
    // Reset document state when component is mounted/unmounted to fix any stuck dialog issues
    useEffect(() => {
        // Reset document state on mount in case of previous issues
        document.body.style.overflow = "";
        
        // Make sure all elements are interactive
        setTimeout(() => {
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
                if (el instanceof HTMLElement) {
                    el.inert = false;
                }
            }
        }, 0);
        
        // Reset document state on unmount
        return () => {
            document.body.style.overflow = "";
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
                if (el instanceof HTMLElement) {
                    el.inert = false;
                }
            }
        };
    }, []);
    
    // Monitor dialog state and fix potential stuck states
    useEffect(() => {
        if (!isTrashDialogOpen) {
            // When dialog closes, ensure the document is returned to normal
            setTimeout(() => {
                document.body.style.overflow = "";
                const elements = document.querySelectorAll('*');
                for (const el of elements) {
                    if (el instanceof HTMLElement) {
                        el.inert = false;
                    }
                }
            }, 300); // Match the animation duration from Dialog.tsx
        }
    }, [isTrashDialogOpen]);
    
    // Check if the email has styling
    const emailHasStyling = useMemo(() => {
        return hasEmailStyling(email.body || "");
    }, [email.body]);
    
    // Format the email content if it's plain text
    const formattedEmailContent = useMemo(() => {
        if (emailHasStyling) {
            return email.body || decodeHtmlEntities(email.snippet || "");
        }
        return formatPlainTextEmail(email.body || decodeHtmlEntities(email.snippet || ""));
    }, [email.body, email.snippet, emailHasStyling]);
    
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
        // Show confirmation dialog instead of immediately deleting
        setIsTrashDialogOpen(true);
    };
    
    const confirmTrash = () => {
        if (onTrash) {
            onTrash(email);
        }
        
        // Make everything interactive again before closing dialog
        document.body.style.overflow = "";
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
            if (el instanceof HTMLElement) {
                el.inert = false;
            }
        }
        
        setIsTrashDialogOpen(false);
        
        // Delayed cleanup to handle any persistence
        setTimeout(() => {
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
                if (el instanceof HTMLElement) {
                    el.inert = false;
                }
            }
            document.body.style.overflow = "";
        }, 500);
    };
    
    const cancelTrash = () => {
        // Make everything interactive again before closing dialog
        document.body.style.overflow = "";
        const elements = document.querySelectorAll('*');
        for (const el of elements) {
            if (el instanceof HTMLElement) {
                el.inert = false;
            }
        }
        
        setIsTrashDialogOpen(false);
        
        // Delayed cleanup to handle any persistence
        setTimeout(() => {
            const elements = document.querySelectorAll('*');
            for (const el of elements) {
                if (el instanceof HTMLElement) {
                    el.inert = false;
                }
            }
            document.body.style.overflow = "";
        }, 500);
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

    const first2Keywords = email.aiMetadata?.keywords?.slice(0, 2);

    // Check if we have other emails in this thread
    const hasMultipleEmails = thread?.emails?.length && thread.emails.length > 1;

    return (
        <>
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
                                            {/* <Text variant="body-default-s">
                                                {email.aiMetadata.summary}
                                            </Text> */}
                                        </Column>
                                    )}

                                    {/* Key Points */}
                                    {email.aiMetadata.keywords && email.aiMetadata.keywords.length > 0 && (
                                        <Column gap="4" fillWidth>
                                            <Text variant="label-default-s" onBackground="neutral-weak">
                                                Key Points
                                            </Text>
                                            <Column gap="4" fillWidth>
                                                {first2Keywords?.map((keyword: string) => (
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
                            /* Base styles for all emails */
                            .email-body {
                                width: 100%;
                                height: 100%;
                                border-radius: 12px;
                                padding: var(--static-space-20);
                                position: relative;
                                font-family: var(--static-font-family-sans);
                                font-size: 14px;
                                line-height: 1.5;
                            }
                            
                            /* Default styling for emails without their own styling */
                            .email-body.no-styling {
                                color: var(--static-white);
                                background-color: var(--static-color-neutral-800);
                            }
                            
                            /* Styling for formatted plain text */
                            .email-body.no-styling p {
                                margin-top: 0;
                                margin-bottom: 1.2em;
                            }
                            
                            .email-body.no-styling a {
                                color: var(--static-color-brand-300);
                                text-decoration: underline;
                                font-weight: 500;
                            }
                            
                            .email-body.no-styling a:hover {
                                color: var(--static-color-brand-200);
                                text-decoration: none;
                            }
                            
                            .email-body.no-styling ul, 
                            .email-body.no-styling ol {
                                margin: 0.5em 0 1em 0;
                                padding-left: 2em;
                            }
                            
                            .email-body.no-styling li {
                                margin-bottom: 0.5em;
                                padding-left: 0.5em;
                            }
                            
                            /* Styles for emails with their own styling */
                            .email-body.has-styling {
                                background: var(--static-white);
                                color: var(--static-black);
                            }
                        `}</style>
                        <div
                            className={`email-body ${!emailHasStyling ? 'no-styling' : 'has-styling'}`}
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(formattedEmailContent),
                            }}
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
            
            {/* Trash Confirmation Dialog */}
            <Dialog
                isOpen={isTrashDialogOpen}
                onClose={cancelTrash}
                title="Move to Trash"
            >
                <Column gap="16">
                    <Text variant="body-default-m">
                        Are you sure you want to move this email to trash?
                    </Text>
                    <Row gap="8" horizontal="end">
                        <Button 
                            variant="secondary" 
                            label="Cancel" 
                            onClick={cancelTrash} 
                        />
                        <Button 
                            variant="danger" 
                            label="Move to Trash" 
                            onClick={confirmTrash} 
                        />
                    </Row>
                </Column>
            </Dialog>
        </>
    );
}
