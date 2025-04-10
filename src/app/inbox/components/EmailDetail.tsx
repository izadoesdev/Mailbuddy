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

    return (
        <Column fill radius="xl" border="neutral-alpha-medium" overflow="hidden">
            <Column gap="24" fill>
                <Row horizontal="space-between" vertical="center" paddingY="12" paddingX="24" borderBottom="neutral-alpha-medium" >
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
                    <IconButton tooltip="Close" tooltipPosition="left" variant="ghost" icon="close" onClick={onClose} />
                </Row>

                <Row gap="16" vertical="center" paddingX="24">
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

                <Row fill paddingX="8">
                    <div
                        dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(email.body || email.snippet || ""),
                        }}
                        style={{ width: "100%", height: "100%", overflow: "auto", backgroundColor: "#fff", borderRadius: "12px" }}
                    />
                </Row>

                <Row gap="8" horizontal="end" borderTop="neutral-alpha-medium" paddingY="8" paddingX="16">
                    <Button variant="secondary" label="Forward" prefixIcon="arrowRight" />
                    <Button label="Reply" prefixIcon="reply" />
                </Row>
            </Column>
        </Column>
    );
}
