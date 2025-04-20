import {
    Chip,
    Column,
    Icon,
    IconButton,
    Line,
    Row,
    Tag,
    Text,
    useToast,
} from "@/once-ui/components";
import React from "react";
import type { Email, Thread } from "../types";
import { extractName, formatDate } from "../utils";

// Priority levels and their corresponding colors
const PRIORITY_COLORS: Record<string, "warning" | "info" | "success" | "danger" | "neutral"> = {
    urgent: "danger",
    high: "warning",
    medium: "info",
    low: "success",
};

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

interface EmailItemProps {
    email: Email | Thread;
    index: number;
    isSelected: boolean;
    totalEmails: number;
    onSelect: (email: Email | Thread) => void;
    onToggleStar: (email: Email | Thread, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailItem({
    email,
    index,
    isSelected,
    totalEmails,
    onSelect,
    onToggleStar,
}: EmailItemProps) {
    const senderName = (email as any).fromName || extractName(email.from ?? "");

    // Determine if this is a thread object or a single email
    const isThread = "threadId" in email && "emails" in email;
    const emailCount = isThread ? (email as Thread).emailCount : 1;

    // Get AI metadata
    const aiMetadata = email.aiMetadata;
    const aiPriority = aiMetadata?.priority?.toLowerCase();
    const aiCategory = aiMetadata?.category
        ?.split(",")
        .map((c) => c.trim())
        .filter(Boolean);
    const priorityColor = aiPriority ? PRIORITY_COLORS[aiPriority] || "neutral" : undefined;

    // Prepare labels for rendering
    const importantLabel = email.labels?.includes("IMPORTANT");
    const customLabels = email.labels
        ?.filter((label) => !["IMPORTANT", "UNREAD", "INBOX"].includes(label))
        .map((label) => label.replace("CATEGORY_", ""));

    // Ensure no duplicates between AI categories and Gmail labels
    const aiCategoriesToShow = aiCategory?.filter(
        (cat) => !customLabels?.some((label) => label.toLowerCase() === cat.toLowerCase()),
    );

    // Calculate remaining labels count
    const shownLabelsCount = 2;
    const remainingLabelsCount =
        (customLabels?.length || 0) + (aiCategoriesToShow?.length || 0) - shownLabelsCount;

    return (
        <React.Fragment>
            <Row
                fillWidth
                onClick={() => onSelect(email)}
                cursor="interactive"
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onSelect(email);
                    }
                }}
                tabIndex={0}
            >
                <Row
                    fillWidth
                    padding="16"
                    gap="16"
                    transition="micro-medium"
                    background={
                        isSelected ? "neutral-alpha-weak" : email.isRead ? "overlay" : "overlay"
                    }
                >
                    <Column vertical="center" gap="8">
                        <Row width={8} vertical="center" gap="4">
                            <IconButton
                                variant="ghost"
                                size="s"
                                onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                    onToggleStar(email, e)
                                }
                                aria-label={email.isStarred ? "Unstar email" : "Star email"}
                            >
                                <Icon
                                    size="s"
                                    onBackground={
                                        email.isStarred ? "warning-weak" : "neutral-medium"
                                    }
                                    name={email.isStarred ? "starFill" : "star"}
                                />
                            </IconButton>
                            <Text
                                variant={email.isRead ? "body-default-s" : "body-strong-s"}
                                onBackground={email.isRead ? "neutral-weak" : "neutral-strong"}
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {senderName}
                            </Text>
                        </Row>
                    </Column>

                    <Column fillWidth gap="2">
                        <Row fillWidth horizontal="space-between" gap="24">
                            <Row vertical="center" gap="8" fillWidth>
                                <Text
                                    variant={email.isRead ? "body-default-m" : "body-strong-m"}
                                    style={{
                                        overflow: "hidden",
                                        textOverflow: "ellipsis",
                                        whiteSpace: "nowrap",
                                    }}
                                >
                                    {email.subject}
                                </Text>

                                {/* Thread count badge */}
                                {isThread && emailCount > 1 && (
                                    <Row vertical="center" gap="2">
                                        <Icon name="chat" size="xs" onBackground="brand-medium" />
                                        <Tag variant="brand" size="s" label={`${emailCount}`} />
                                    </Row>
                                )}

                                {/* AI priority badge */}
                                {aiPriority && (
                                    <Tag
                                        label={aiMetadata?.priority || ""}
                                        variant={priorityColor}
                                        size="s"
                                    />
                                )}
                            </Row>
                            <Row gap="8" vertical="center">
                                <Text
                                    variant="label-default-s"
                                    onBackground="neutral-weak"
                                    wrap="nowrap"
                                >
                                    {formatDate(
                                        "createdAt" in email
                                            ? email.createdAt
                                            : email.internalDate
                                              ? new Date(Number(email.internalDate))
                                              : new Date(),
                                    )}
                                </Text>
                            </Row>
                        </Row>

                        <Row
                            fillWidth
                            gap="24"
                            horizontal="space-between"
                            textVariant="body-default-s"
                        >
                            {/* Email snippet */}
                            {aiMetadata?.summary ? (
                                <Row vertical="center" gap="8" fillWidth>
                                    <Icon onBackground="brand-medium" name="sparkles" size="xs" />
                                    <Text
                                        onBackground="brand-medium"
                                        style={{
                                            overflow: "hidden",
                                            textOverflow: "ellipsis",
                                            whiteSpace: "nowrap",
                                        }}
                                    >
                                        {aiMetadata.summary}
                                    </Text>
                                </Row>
                            ) : (
                                decodeHtmlEntities(email.snippet || "")
                            )}

                            {/* Labels section */}
                            {(importantLabel ||
                                (customLabels && customLabels.length > 0) ||
                                (aiCategoriesToShow && aiCategoriesToShow.length > 0)) && (
                                <Row gap="4">
                                    {/* Display AI categories */}
                                    {aiCategoriesToShow
                                        ?.slice(
                                            0,
                                            shownLabelsCount -
                                                (customLabels?.slice(
                                                    0,
                                                    shownLabelsCount -
                                                        (aiCategoriesToShow?.length || 0),
                                                ).length || 0),
                                        )
                                        .map((category) => (
                                            <Tag key={`ai-cat-${category}`} label={category} />
                                        ))}

                                    {/* Count chip for remaining labels */}
                                    {remainingLabelsCount > 0 && (
                                        <Tag label={`+${remainingLabelsCount}`} />
                                    )}
                                </Row>
                            )}
                        </Row>
                    </Column>
                </Row>
            </Row>
            {index < totalEmails - 1 && <Line color="neutral-alpha-weak" />}
        </React.Fragment>
    );
}
