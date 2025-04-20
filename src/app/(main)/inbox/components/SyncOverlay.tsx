import { Button, Column, Icon, Row, Text } from "@/once-ui/components";
import type { MouseEvent } from "react";

interface SyncOverlayProps {
    isVisible: boolean;
    progress: number;
    message: string;
    onCancel?: () => void;
    onReset?: () => void;
    error?: boolean;
    errorType?: string;
}

export function SyncOverlay({
    isVisible,
    progress,
    message,
    onCancel,
    onReset,
    error = false,
    errorType = "unknown_error",
}: SyncOverlayProps) {
    if (!isVisible) return null;

    // Define error-specific content
    const getErrorContent = () => {
        switch (errorType) {
            case "no_gmail_account":
                return {
                    title: "Gmail Account Needed",
                    message: "You need to connect a Gmail account before syncing your emails.",
                    buttonText: "Connect Gmail",
                    buttonAction: () => {
                        window.location.href = "/profile?tab=accounts";
                    },
                };
            case "invalid_credentials":
                return {
                    title: "Gmail Access Required",
                    message:
                        "Your Gmail account needs to be reconnected to continue syncing emails.",
                    buttonText: "Update Account",
                    buttonAction: () => {
                        window.location.href = "/profile?tab=accounts";
                    },
                };
            default:
                return {
                    title: "Sync Error",
                    message: message || "There was a problem syncing your emails.",
                    buttonText: "Back to Inbox",
                    buttonAction: onCancel,
                };
        }
    };

    const errorContent = error ? getErrorContent() : null;

    return (
        <Row fill center position="fixed" padding="l" zIndex={9} background="overlay">
            <Column
                background="page"
                shadow="xl"
                radius="xl"
                border="neutral-medium"
                padding="48"
                maxWidth="s"
                horizontal="center"
                gap="12"
            >
                <Icon
                    name={error ? "errorCircle" : "mail"}
                    size="m"
                    onBackground="neutral-strong"
                    marginBottom="16"
                    padding="8"
                    radius="full"
                    border="neutral-medium"
                    style={error ? { color: "var(--color-danger)" } : undefined}
                />

                <Text variant="heading-strong-l" align="center">
                    {error ? errorContent?.title : "Syncing Your Emails"}
                </Text>

                <Text align="center" wrap="balance" onBackground="neutral-weak">
                    {error
                        ? errorContent?.message
                        : "Please wait while we sync your emails. This might take a few minutes depending on how many emails you have."}
                </Text>

                <Column gap="12" fillWidth paddingY="48">
                    {!error && (
                        <>
                            <Row
                                fillWidth
                                height="8"
                                background="overlay"
                                radius="full"
                                overflow="hidden"
                            >
                                <Row
                                    fillHeight
                                    solid="brand-strong"
                                    radius="full"
                                    transition="micro-medium"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </Row>

                            <Row horizontal="space-between" vertical="center" paddingX="8">
                                <Text variant="body-default-s" onBackground="neutral-weak">
                                    {message}
                                </Text>
                                <Text variant="body-default-s">{progress}%</Text>
                            </Row>
                        </>
                    )}

                    {error && (
                        <Text
                            variant="body-default-s"
                            align="center"
                            style={{ color: "var(--color-danger-weak)" }}
                        >
                            {errorType === "unknown_error" ? message : ""}
                        </Text>
                    )}
                </Column>

                {error ? (
                    <Row gap="8">
                        <Button
                            variant="danger"
                            onClick={errorContent?.buttonAction || onCancel}
                            prefixIcon={
                                ["no_gmail_account", "invalid_credentials"].includes(errorType)
                                    ? "settings"
                                    : "arrowLeft"
                            }
                            weight="default"
                        >
                            {errorContent?.buttonText}
                        </Button>

                        {onReset &&
                            errorType !== "no_gmail_account" &&
                            errorType !== "invalid_credentials" && (
                                <Button
                                    variant="secondary"
                                    onClick={(e: MouseEvent) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        if (onReset) onReset();
                                    }}
                                    prefixIcon="refresh"
                                    weight="default"
                                >
                                    Try Again
                                </Button>
                            )}
                    </Row>
                ) : (
                    onCancel && (
                        <Button
                            variant="secondary"
                            onClick={onCancel}
                            prefixIcon="close"
                            weight="default"
                        >
                            Cancel
                        </Button>
                    )
                )}
            </Column>
        </Row>
    );
}
