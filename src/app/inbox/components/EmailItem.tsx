import React from "react";
import {
    Text,
    Row,
    Column,
    Chip,
    Line,
    IconButton,
    Avatar,
    Badge,
    Card,
    Tag,
} from "@/once-ui/components";
import type { Email } from "../types";
import { extractName, getInitials, formatDate } from "../utils";

interface EmailItemProps {
    email: Email;
    index: number;
    isSelected: boolean;
    totalEmails: number;
    onSelect: (email: Email) => void;
    onToggleStar: (email: Email, e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EmailItem({
    email,
    index,
    isSelected,
    totalEmails,
    onSelect,
    onToggleStar,
}: EmailItemProps) {
    const senderName = extractName(email.from ?? "");

    return (
        <React.Fragment>
            <Row
                fillWidth
                onClick={() => onSelect(email)}
                onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                        onSelect(email);
                    }
                }}
            >
                <Row
                    fillWidth
                    padding="16"
                    gap="16"
                    transition="micro-medium"
                    background={isSelected ? "neutral-medium" : email.isRead ? "page" : "overlay"}
                >
                    <Row gap="12" vertical="center">
                        <IconButton
                            variant="ghost"
                            size="s"
                            icon={email.isStarred ? "starFill" : "star"}
                            onClick={(e: React.MouseEvent<HTMLButtonElement>) =>
                                onToggleStar(email, e)
                            }
                            color={email.isStarred ? "warning" : "neutral"}
                        />
                        <Avatar size="m" value={getInitials(senderName)} />
                    </Row>

                    <Column gap="4" fill>
                        <Row fillWidth horizontal="space-between">
                            <Text
                                variant={email.isRead ? "body-default-m" : "body-strong-m"}
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                }}
                            >
                                {senderName}
                            </Text>
                            <Row gap="8" vertical="center">
                                {email.labels?.includes("IMPORTANT") && (
                                    <Tag variant="neutral" label="Important" />
                                )}
                                <Text variant="label-default-s" onBackground="neutral-weak">
                                    {formatDate(email.createdAt)}
                                </Text>
                            </Row>
                        </Row>

                        <Text
                            variant={email.isRead ? "body-default-m" : "body-strong-m"}
                            style={{
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                            }}
                        >
                            {email.subject}
                            {email.aiMetadata && (
                                <span style={{ marginLeft: "8px", color: "#0070f3" }}>✨</span>
                            )}
                        </Text>

                        <Row fillWidth horizontal="space-between">
                            <Text
                                variant="body-default-s"
                                onBackground="neutral-weak"
                                style={{
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                    maxWidth: "70%",
                                }}
                            >
                                {(email as any).aiScore ? (
                                    <span style={{ color: "#0070f3" }}>
                                        AI Score: {(email as any).aiScore.toFixed(4)} -{" "}
                                        {email.snippet}
                                    </span>
                                ) : (
                                    email.snippet
                                )}
                            </Text>

                            {email.labels?.length > 0 &&
                                email.labels.some(
                                    (l: string) => !["IMPORTANT", "UNREAD", "INBOX"].includes(l),
                                ) && (
                                    <Row gap="4">
                                        {email.labels
                                            .filter(
                                                (label: string) =>
                                                    !["IMPORTANT", "UNREAD", "INBOX"].includes(
                                                        label,
                                                    ),
                                            )
                                            .slice(0, 2)
                                            .map((label: string) => (
                                                <Chip
                                                    key={label}
                                                    label={label.replace("CATEGORY_", "")}
                                                />
                                            ))}
                                        {email.labels.filter(
                                            (l: string) =>
                                                !["IMPORTANT", "UNREAD", "INBOX"].includes(l),
                                        ).length > 2 && (
                                            <Chip label={`+${email.labels.length - 2}`} />
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
