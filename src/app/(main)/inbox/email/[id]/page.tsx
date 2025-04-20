"use client";

import { useUser } from "@/libs/auth/client";
import { Button, Column, Icon, Row, Spinner, Text } from "@/once-ui/components";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ComposeEmail } from "../../components/ComposeEmail";
import { EmailDetail } from "../../components/EmailDetail";
import { useEmail } from "../../hooks/useEmail";
import { useEmailMutations } from "../../hooks/useEmailMutations";
import type { Email, Thread } from "../../types";
import { extractName } from "../../utils";

export default function EmailDetailPage() {
    const router = useRouter();
    const params = useParams();
    const { user } = useUser();
    const emailId = params?.id as string;

    const [thread, setThread] = useState<Thread | null>(null);
    const [error, setError] = useState("");

    // Compose email states
    const [isReplying, setIsReplying] = useState(false);
    const [isForwarding, setIsForwarding] = useState(false);
    const [composeData, setComposeData] = useState({
        to: "",
        subject: "",
        body: "",
        threadId: "",
    });

    // Use TanStack Query to fetch the email
    const {
        data: email,
        isLoading,
        isError,
        error: emailError,
        refetch: refetchEmail,
    } = useEmail(emailId, { enabled: !!emailId && !!user });

    // Use email mutations
    const { toggleStar, trashEmail } = useEmailMutations();

    // Construct thread object from email and threadEmails
    useEffect(() => {
        if (email?.threadId && email) {
            setThread({
                threadId: email.threadId,
                emails: [email],
                subject: email.subject || "",
                from: email.from || "",
                to: email.to || "",
                snippet: email.snippet || "",
                isRead: email.isRead,
                isStarred: email.isStarred,
                labels: email.labels || [],
                internalDate: email.internalDate || "",
                aiMetadata: email.aiMetadata,
                emailCount: 1,
            });
        }
    }, [email]);

    // Set error from email query if it fails
    useEffect(() => {
        if (isError && emailError) {
            setError(emailError instanceof Error ? emailError.message : "Failed to fetch email");
        }
    }, [isError, emailError]);

    const handleGoBack = () => {
        router.back();
    };

    const handleToggleStar = async (
        item: Email | Thread,
        e?: React.MouseEvent<HTMLButtonElement>,
    ) => {
        if (e) {
            e.stopPropagation();
        }

        try {
            // Make sure we're working with an Email object
            const id = "id" in item ? item.id : email?.id;
            if (!id) return;

            toggleStar.mutate({
                emailId: id,
                isStarred: !("isStarred" in item ? item.isStarred : false),
            });
        } catch (err) {
            console.error("Error toggling star:", err);
        }
    };

    const handleReply = (emailToReply: Email) => {
        // Create a reply template
        const senderName = emailToReply.fromName || extractName(emailToReply.from || "");
        const subject = emailToReply.subject?.startsWith("Re:")
            ? emailToReply.subject
            : `Re: ${emailToReply.subject || ""}`;

        // Create the reply body with quoted original content
        const date = emailToReply.createdAt
            ? new Date(emailToReply.createdAt).toLocaleString()
            : "";
        const replyBody = `<br/><br/>On ${date}, ${senderName} &lt;${emailToReply.from}&gt; wrote:<br/><blockquote style="border-left: 2px solid #ccc; padding-left: 10px; color: #777;">${emailToReply.body || ""}</blockquote>`;

        setComposeData({
            to: emailToReply.from || "",
            subject: subject,
            body: replyBody,
            threadId: emailToReply.threadId || "",
        });

        setIsReplying(true);
        setIsForwarding(false);
    };

    const handleForward = (emailToForward: Email) => {
        // Create a forward template
        const subject = emailToForward.subject?.startsWith("Fwd:")
            ? emailToForward.subject
            : `Fwd: ${emailToForward.subject || ""}`;

        // Create the forward body with the original content
        const date = emailToForward.createdAt
            ? new Date(emailToForward.createdAt).toLocaleString()
            : "";
        const forwardBody = `<br/><br/>---------- Forwarded message ----------<br/>
From: ${emailToForward.from}<br/>
Date: ${date}<br/>
Subject: ${emailToForward.subject}<br/>
To: ${emailToForward.to}<br/><br/>
${emailToForward.body || ""}`;

        setComposeData({
            to: "",
            subject: subject,
            body: forwardBody,
            threadId: "", // Don't attach to thread when forwarding
        });

        setIsForwarding(true);
        setIsReplying(false);
    };

    const handleTrash = async (email: Email) => {
        try {
            await trashEmail.mutateAsync(email.id);
            router.push("/inbox");
        } catch (err) {
            console.error("Error moving to trash:", err);
        }
    };

    const handleSelectEmail = (selectedEmail: Email) => {
        // If it's the same email, don't reload
        if (selectedEmail.id === email?.id) return;

        // Navigate to the selected email
        router.push(`/inbox/email/${selectedEmail.id}`);
    };

    const handleComposeSuccess = () => {
        // Refetch email and thread data after sending
        refetchEmail();
    };

    if (isLoading) {
        return (
            <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
                <Spinner size="m" />
                <Text>Loading email...</Text>
            </Column>
        );
    }

    if (error) {
        return (
            <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
                <Icon name="errorCircle" size="l" color="danger" />
                <Text>{error}</Text>
                <Button variant="primary" onClick={handleGoBack}>
                    Go Back
                </Button>
            </Column>
        );
    }

    if (!email) {
        return (
            <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
                <Icon name="errorCircle" size="l" color="danger" />
                <Text>Email not found</Text>
                <Button variant="primary" onClick={handleGoBack}>
                    Go Back
                </Button>
            </Column>
        );
    }

    return (
        <Column fillWidth padding="24" gap="16">
            <Row gap="8" vertical="center">
                <Button variant="tertiary" size="s" onClick={handleGoBack} prefixIcon="arrowLeft">
                    Back
                </Button>
            </Row>

            <EmailDetail
                email={email}
                thread={thread}
                onClose={handleGoBack}
                onToggleStar={handleToggleStar}
                onReply={handleReply}
                onForward={handleForward}
                onTrash={handleTrash}
                onSelectEmail={handleSelectEmail}
            />

            {/* Compose Email for Reply/Forward */}
            {(isReplying || isForwarding) && (
                <ComposeEmail
                    threadId={composeData.threadId}
                    initialTo={composeData.to}
                    initialSubject={composeData.subject}
                    initialBody={composeData.body}
                    onClose={() => {
                        setIsReplying(false);
                        setIsForwarding(false);
                    }}
                    onSuccess={handleComposeSuccess}
                />
            )}
        </Column>
    );
}
