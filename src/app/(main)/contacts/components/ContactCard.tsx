import { Avatar, Card, Column, Icon, Line, Row, Tag, Text } from "@/once-ui/components";
import React from "react";
import { formatDate } from "../../inbox/utils";
import type { Contact } from "../types";

const PRIORITY_COLORS = {
    Urgent: "danger",
    High: "warning",
    Medium: "info",
    Low: "success",
} as const;

interface ContactCardProps {
    contact: Contact;
    onClick?: () => void;
    selected?: boolean;
}

export function ContactCard({ contact, onClick, selected }: ContactCardProps) {
    // Get dominant category
    const dominantCategory =
        Object.entries(contact.categories)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([category]) => category)[0] || "Uncategorized";

    // Get dominant priority
    const dominantPriority =
        Object.entries(contact.priorities)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([priority]) => priority)[0] || "Medium";

    // Calculate initials from name
    const initials = contact.name
        .split(" ")
        .map((part) => part?.[0] || "")
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <Card
            padding="m"
            fillWidth
            onClick={onClick}
            cursor={onClick ? "pointer" : "default"}
            border={selected ? "brand-weak" : "neutral-alpha-medium"}
            style={{
                transition: "all 0.2s ease",
                backgroundColor: selected ? "var(--solid-brand-weak)" : undefined,
            }}
        >
            <Column gap="16" fillWidth>
                <Row gap="16" vertical="center" fillWidth>
                    <Avatar size="l" value={initials} />
                    <Column gap="4" fill>
                        <Row vertical="center" gap="8">
                            <Text variant="heading-strong-m">{contact.name}</Text>
                            {contact.isStarred && <Icon name="starFill" size="s" color="warning" />}
                        </Row>
                        <Text variant="body-default-s" onBackground="neutral-weak">
                            {contact.email}
                        </Text>
                    </Column>
                </Row>

                <Line color="neutral-alpha-medium" />

                <Row wrap gap="16" vertical="center">
                    <Column gap="4">
                        <Text variant="label-default-xs" onBackground="neutral-weak">
                            EMAILS
                        </Text>
                        <Text variant="body-strong-m">{contact.emailCount}</Text>
                    </Column>

                    <Column gap="4">
                        <Text variant="label-default-xs" onBackground="neutral-weak">
                            THREADS
                        </Text>
                        <Text variant="body-strong-m">{contact.threadCount}</Text>
                    </Column>

                    <Column gap="4">
                        <Text variant="label-default-xs" onBackground="neutral-weak">
                            LAST CONTACT
                        </Text>
                        <Text variant="body-default-s">
                            {formatDate(new Date(contact.latestEmailDate))}
                        </Text>
                    </Column>

                    {contact.unreadCount > 0 && (
                        <Column gap="4">
                            <Text variant="label-default-xs" onBackground="neutral-weak">
                                UNREAD
                            </Text>
                            <Tag variant="danger" label={String(contact.unreadCount)} size="s" />
                        </Column>
                    )}
                </Row>

                <Row gap="8" wrap>
                    <Tag variant="neutral" label={`Category: ${dominantCategory}`} />
                    <Tag
                        variant={
                            PRIORITY_COLORS[dominantPriority as keyof typeof PRIORITY_COLORS] ||
                            "neutral"
                        }
                        label={`Priority: ${dominantPriority}`}
                    />
                </Row>
            </Column>
        </Card>
    );
}
