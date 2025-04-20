import {
    Avatar,
    Button,
    Card,
    Chip,
    Column,
    Heading,
    Icon,
    IconButton,
    Line,
    Row,
    Tag,
    Text,
} from "@/once-ui/components";
import React, { useState } from "react";
import { ComposeEmail } from "../../inbox/components/ComposeEmail";
import { formatDate } from "../../inbox/utils";
import type { Contact } from "../types";

// Priority color mapping
const PRIORITY_COLORS = {
    Urgent: "danger",
    High: "warning",
    Medium: "info",
    Low: "success",
} as const;

interface ContactDetailProps {
    contact: Contact;
    onClose: () => void;
    onViewEmails?: (contact: Contact) => void;
}

export function ContactDetail({ contact, onClose, onViewEmails }: ContactDetailProps) {
    const [isComposing, setIsComposing] = useState(false);

    // Get the contact's initials
    const initials = contact.name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    // Sort categories by email count
    const sortedCategories = Object.entries(contact.categories).sort(
        ([, countA], [, countB]) => countB - countA,
    );

    // Sort priorities by email count
    const sortedPriorities = Object.entries(contact.priorities).sort(
        ([, countA], [, countB]) => countB - countA,
    );

    const handleComposeEmail = () => {
        setIsComposing(true);
    };

    const handleCloseCompose = () => {
        setIsComposing(false);
    };

    return (
        <>
            <Card padding="0" fill radius="m" border="neutral-alpha-medium" overflow="hidden">
                <Column fill>
                    {/* Header */}
                    <Row
                        paddingY="16"
                        paddingX="24"
                        horizontal="space-between"
                        borderBottom="neutral-alpha-medium"
                        background="neutral-alpha-weak"
                    >
                        <Row gap="12" vertical="center">
                            <Heading variant="heading-strong-m">Contact Details</Heading>
                        </Row>
                        <IconButton
                            tooltip="Close"
                            tooltipPosition="left"
                            variant="ghost"
                            icon="close"
                            onClick={onClose}
                        />
                    </Row>

                    {/* Contact information */}
                    <Column padding="24" gap="24" fill overflowY="auto">
                        {/* Contact header */}
                        <Row gap="16" vertical="center" wrap>
                            <Avatar size="xl" value={initials} />
                            <Column gap="4">
                                <Row vertical="center" gap="8">
                                    <Heading variant="heading-strong-l">{contact.name}</Heading>
                                    {contact.isStarred && (
                                        <Icon name="starFill" size="s" color="warning" />
                                    )}
                                </Row>
                                <Text variant="body-default-m" onBackground="neutral-weak">
                                    {contact.email}
                                </Text>
                                <Row gap="8" paddingTop="4">
                                    {contact.unreadCount > 0 && (
                                        <Tag
                                            variant="danger"
                                            label={`${contact.unreadCount} unread`}
                                            size="s"
                                        />
                                    )}
                                    <Tag
                                        variant="neutral"
                                        label={`${contact.emailCount} emails`}
                                        size="s"
                                    />
                                    <Tag
                                        variant="neutral"
                                        label={`${contact.threadCount} threads`}
                                        size="s"
                                    />
                                </Row>
                            </Column>

                            <Row wrap gap="8" style={{ marginLeft: "auto" }}>
                                <Button
                                    variant="secondary"
                                    label="Send Email"
                                    prefixIcon="send"
                                    onClick={handleComposeEmail}
                                />
                                <Button
                                    variant="primary"
                                    label="View Emails"
                                    prefixIcon="mail"
                                    onClick={() => onViewEmails?.(contact)}
                                />
                            </Row>
                        </Row>

                        <Line color="neutral-alpha-medium" />

                        {/* Communication Stats */}
                        <Column gap="16">
                            <Heading variant="heading-strong-s">Communication Stats</Heading>

                            <Row wrap gap="24">
                                {/* Latest communication */}
                                <Column gap="4" minWidth={240}>
                                    <Text variant="label-default-s" onBackground="neutral-weak">
                                        LAST CONTACT
                                    </Text>
                                    <Text variant="body-strong-m">
                                        {formatDate(new Date(contact.latestEmailDate))}
                                    </Text>
                                </Column>

                                {/* Frequency */}
                                <Column gap="4" minWidth={240}>
                                    <Text variant="label-default-s" onBackground="neutral-weak">
                                        EMAIL FREQUENCY
                                    </Text>
                                    <Text variant="body-strong-m">
                                        {contact.emailCount > 10
                                            ? "Frequent"
                                            : contact.emailCount > 5
                                              ? "Regular"
                                              : "Occasional"}
                                    </Text>
                                </Column>
                            </Row>
                        </Column>

                        {/* Categories */}
                        {sortedCategories.length > 0 && (
                            <Column gap="16">
                                <Heading variant="heading-strong-s">Categories</Heading>

                                <Row wrap gap="12">
                                    {sortedCategories.map(([category, count]) => (
                                        <Tag
                                            key={category}
                                            label={`${category} (${count})`}
                                            variant="neutral"
                                        />
                                    ))}
                                </Row>
                            </Column>
                        )}

                        {/* Priorities */}
                        {sortedPriorities.length > 0 && (
                            <Column gap="16">
                                <Heading variant="heading-strong-s">Priorities</Heading>

                                <Row wrap gap="12">
                                    {sortedPriorities.map(([priority, count]) => (
                                        <Tag
                                            key={priority}
                                            label={`${priority} (${count})`}
                                            variant={
                                                PRIORITY_COLORS[
                                                    priority as keyof typeof PRIORITY_COLORS
                                                ] || "neutral"
                                            }
                                        />
                                    ))}
                                </Row>
                            </Column>
                        )}
                    </Column>
                </Column>
            </Card>

            {isComposing && (
                <ComposeEmail
                    initialTo={contact.email}
                    initialSubject={`Hello ${contact.name}`}
                    onClose={handleCloseCompose}
                    onSuccess={() => {
                        handleCloseCompose();
                    }}
                />
            )}
        </>
    );
}
