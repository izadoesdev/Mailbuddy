"use client";

import { signOut } from "@/libs/auth/client";
import {
    Background,
    Button,
    Card,
    Column,
    Heading,
    Icon,
    InlineCode,
    Line,
    Row,
    Spinner,
    Text,
    useToast,
} from "@/once-ui/components";
import { useRouter } from "next/navigation";
import React, { useState, useCallback, useEffect } from "react";

// Helper function for client-side logging
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [Sync UI] ${message}`;

    if (data) {
        console.log(logMessage, data);
    } else {
        console.log(logMessage);
    }
};

// Constants for sync process
const SYNC_STAGES = {
    IDLE: "idle",
    MESSAGES: "messages",
    EMAILS: "emails",
    SYNCING: "syncing",
    COMPLETE: "complete",
    ERROR: "error",
} as const;

const MESSAGE_TYPES = {
    INIT: "init",
    PROGRESS: "progress",
    BATCH_START: "batch-start",
    BATCH_COMPLETE: "batch-complete",
    SAVE_RESULT: "save-result",
    COUNT: "count",
    COMPLETE: "complete",
    ERROR: "error",
    RESUME: "resume",
    EMAIL_COMPLETE: "email-complete",
    ABORTED: "aborted",
    POLLING: "polling",
} as const;

const DEFAULT_STATS = {
    totalEmails: 0,
    syncedEmails: 0,
    remainingEmails: 0,
    estimatedTimeRemaining: "Calculating...",
    processedMessages: 0,
    totalMessages: 0,
};

const INITIAL_SYNC_INFO = {
    messagesProcessed: 0,
    totalMessages: 0,
    nextPageToken: null,
    syncStartTime: 0,
    newMessageCount: 0,
    syncLog: [],
};

const DELAY_REDIRECT_MS = 2000;
const BATCH_SIZE = 500;

// Type definitions for better type safety
type SyncStage = (typeof SYNC_STAGES)[keyof typeof SYNC_STAGES];
type MessageType = (typeof MESSAGE_TYPES)[keyof typeof MESSAGE_TYPES];
type StreamType = "message" | "email";

interface SyncStats {
    totalEmails: number;
    syncedEmails: number;
    remainingEmails: number;
    estimatedTimeRemaining: string;
    processedMessages: number;
    totalMessages: number;
}

interface SyncInfo {
    messagesProcessed: number;
    totalMessages: number;
    nextPageToken: string | null;
    syncStartTime: number;
    newMessageCount: number;
    syncLog: Array<{ timestamp: string; message: string }>;
}

interface StreamMessage {
    type: MessageType;
    message: string;
    [key: string]: any;
}

// Component for sync statistics display
const SyncStats = ({
    stats,
    syncInfo,
    currentStage,
}: { stats: SyncStats | null; syncInfo: SyncInfo; currentStage: SyncStage }) => {
    if (!stats) return null;

    return (
        <Card fillWidth radius="m" border="neutral-alpha-weak" padding="24">
            <Column gap="16">
                <Row fillWidth gap="32">
                    <Column flex={1}>
                        <Text variant="label-default-s" onBackground="neutral-weak">
                            Messages
                        </Text>
                        <Row horizontal="space-between" vertical="center">
                            <Text>Processed:</Text>
                            <Text variant="body-strong-m">
                                {stats?.processedMessages ?? 0} / {stats?.totalMessages ?? 0}
                            </Text>
                        </Row>
                    </Column>

                    <Column flex={1}>
                        <Text variant="label-default-s" onBackground="neutral-weak">
                            New Messages
                        </Text>
                        <Row horizontal="space-between" vertical="center">
                            <Text>Found:</Text>
                            <Text variant="body-strong-m">{syncInfo.newMessageCount}</Text>
                        </Row>
                    </Column>
                </Row>

                <Line background="neutral-alpha-weak" />

                <Column>
                    <Text variant="label-default-s" onBackground="neutral-weak">
                        Stage:
                    </Text>
                    <Row horizontal="space-between" vertical="center">
                        <Text>{getSyncStageDisplay(currentStage)}</Text>
                    </Row>
                    <Row horizontal="space-between" vertical="center">
                        <Text>Estimated Time:</Text>
                        <Text variant="body-strong-m">
                            {stats?.estimatedTimeRemaining ?? "Calculating..."}
                        </Text>
                    </Row>
                </Column>

                <SyncLogDisplay syncLog={syncInfo.syncLog} />
            </Column>
        </Card>
    );
};

// Component for sync log display
const SyncLogDisplay = ({
    syncLog,
}: { syncLog: Array<{ timestamp: string; message: string }> }) => {
    if (syncLog.length === 0) return null;

    return (
        <>
            <Line background="neutral-alpha-weak" />
            <Column gap="8">
                <Text variant="label-default-s" onBackground="neutral-weak">
                    Sync Log
                </Text>
                <Card
                    background="neutral-weak"
                    radius="s"
                    padding="16"
                    style={{ maxHeight: "150px", overflow: "auto" }}
                >
                    <Column gap="8">
                        {syncLog.slice(-10).map((logEntry, index) => (
                            <Text
                                key={logEntry.timestamp}
                                variant="body-default-xs"
                                onBackground="neutral-strong"
                            >
                                [{logEntry.timestamp.split("T")[1].split(".")[0]}]{" "}
                                {logEntry.message}
                            </Text>
                        ))}
                    </Column>
                </Card>
            </Column>
        </>
    );
};

// Helper functions
const getSyncStageDisplay = (stage: SyncStage): string => {
    switch (stage) {
        case SYNC_STAGES.MESSAGES:
            return "Message List Sync";
        case SYNC_STAGES.EMAILS:
            return "Email Content Sync";
        case SYNC_STAGES.SYNCING:
            return "Syncing Messages & Emails";
        case SYNC_STAGES.COMPLETE:
            return "Complete";
        case SYNC_STAGES.ERROR:
            return "Error";
        default:
            return "Idle";
    }
};

// Main component
export default function SyncPage() {
    const router = useRouter();
    const { addToast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [status, setStatus] = useState<string>("");
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<SyncStats | null>(null);
    const [syncStage, setSyncStage] = useState<SyncStage>(SYNC_STAGES.IDLE);
    const [syncInfo, setSyncInfo] = useState<SyncInfo>(INITIAL_SYNC_INFO);

    // State for cancel function so it can be updated
    const [cancelSyncFn, setCancelSyncFn] = useState(() => () => {
        addLogEntry("Sync cancelled by user");
        setIsSyncing(false);
        setSyncStage("idle");
        setStatus("Sync cancelled");
        addToast({
            variant: "success",
            message: "Email sync cancelled",
        });
    });

    // Add log entry to the sync log
    const addLogEntry = useCallback((message: string) => {
        const timestamp = new Date().toISOString();
        log(message);
        setSyncInfo((prev) => ({
            ...prev,
            syncLog: [...prev.syncLog, { timestamp, message }],
        }));
    }, []);

    const startSync = useCallback(async () => {
        setIsSyncing(true);
        setError(null);

        // Setup abort controller for message sync
        const messageController = new AbortController();

        // Create cancel function
        const cancelSync = () => {
            messageController.abort();
        };

        // Save the cancel function
        setCancelSyncFn(() => cancelSync);

        // Reset logs and stats
        setSyncInfo((prev) => ({
            ...prev,
            syncLog: [],
            syncStartTime: Date.now(),
            messagesProcessed: 0,
            totalMessages: 0,
            newMessageCount: 0,
        }));

        // Set the sync stage
        setSyncStage("messages");
        setStatus("Starting message list sync...");

        try {
            addLogEntry("Starting message list sync with batch size of 500...");

            // Start message list sync only
            await startMessageStreamSync();

            setSyncStage("complete");
            setStatus("Message list sync completed successfully!");
            setProgress(100);
            addToast({
                variant: "success",
                message: `Message list sync completed! ${syncInfo.newMessageCount} new messages found.`,
            });
        } catch (error) {
            console.error("Error in sync process:", error);
            setError(`Sync failed: ${error instanceof Error ? error.message : String(error)}`);
            setSyncStage("error");
            setIsSyncing(false);

            // Cancel any ongoing sync operations
            cancelSync();
        }
    }, [addLogEntry, addToast, syncInfo.newMessageCount]);

    // Start message stream sync process
    const startMessageStreamSync = async () => {
        try {
            addLogEntry("Starting message list sync with batch size of 500...");

            // Start the message sync stream with batch size 500
            const response = await fetch("/api/sync/messages?batchSize=500", {
                method: "POST",
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Failed to start message sync: ${response.status} ${errorText}`);
            }

            if (!response.body) {
                throw new Error("No response body received for message sync");
            }

            // Process the stream in the background
            const reader = response.body.getReader();

            // Start reading in the background
            await readStreamInBackground(reader, "message");

            addLogEntry("Message list sync completed successfully");
        } catch (error) {
            console.error("Failed to start message sync:", error);
            setError(
                `Failed to start message sync: ${error instanceof Error ? error.message : String(error)}`,
            );
            setSyncStage("error");
            addLogEntry(
                `Failed to start message sync: ${error instanceof Error ? error.message : String(error)}`,
            );
            throw error;
        }
    };

    // Read stream in background and update UI accordingly
    const readStreamInBackground = async (
        reader: ReadableStreamDefaultReader<Uint8Array>,
        streamType: "message" | "email",
    ) => {
        try {
            let buffer = "";

            while (true) {
                const { done, value } = await reader.read();

                if (done) {
                    // Process any remaining buffer
                    if (buffer) {
                        try {
                            const data = JSON.parse(buffer);
                            handleStreamMessage(data, streamType);
                        } catch (e) {
                            console.error("Error parsing final buffer:", e);
                        }
                    }

                    // Log the completion of this stream
                    addLogEntry(
                        `${streamType === "message" ? "Message list" : "Email content"} sync stream completed`,
                    );

                    // Don't change sync stage to complete for individual streams
                    // This will be handled in the main startSync function
                    break;
                }

                // Decode the chunk and add to buffer
                const chunk = new TextDecoder().decode(value);
                buffer += chunk;

                // Process complete JSON objects from the buffer
                let newlineIndex: number;
                while (true) {
                    newlineIndex = buffer.indexOf("\n");
                    if (newlineIndex === -1) break;

                    // Process each line as a JSON object
                    const line = buffer.slice(0, newlineIndex).trim();
                    buffer = buffer.slice(newlineIndex + 1);

                    if (line) {
                        try {
                            const data = JSON.parse(line);
                            handleStreamMessage(data, streamType);
                        } catch (e) {
                            console.error("Error parsing message:", e, "Line:", line);
                        }
                    }
                }
            }
        } catch (error) {
            console.error(`Error reading ${streamType} stream:`, error);

            // Add log entry for the error
            addLogEntry(
                `Error in ${streamType} stream: ${error instanceof Error ? error.message : String(error)}`,
            );

            // Only update error state if we're still in a sync stage
            if (syncStage === "syncing") {
                setError(
                    `Failed to read ${streamType} stream: ${error instanceof Error ? error.message : String(error)}`,
                );
            }

            // Don't set syncStage to error here - let the parent startSync function handle it
            // so it can properly coordinate both streams
            throw error;
        }
    };

    // Handle incoming stream messages and update UI accordingly
    const handleStreamMessage = (data: any, streamType: "message" | "email") => {
        // First log the message for certain message types
        if (
            [
                "error",
                "batch-start",
                "batch-complete",
                "resume",
                "complete",
                "polling",
                "aborted",
            ].includes(data.type)
        ) {
            addLogEntry(
                `${streamType === "message" ? "[Messages]" : "[Emails]"} ${data.type}: ${data.message || JSON.stringify(data)}`,
            );
        }

        // Handle different message types
        switch (data.type) {
            case "progress":
                // For message sync only, use full progress range (0-100%)
                if (streamType === "message") {
                    const messageProgress = data.progress;
                    setProgress(Math.min(Math.round(messageProgress), 100));

                    // Update status message
                    setStatus(
                        `Syncing message list: ${data.processedMessages} of ${data.totalMessages}`,
                    );

                    // Update stats
                    setStats((prev) => ({
                        ...(prev || {
                            totalEmails: 0,
                            syncedEmails: 0,
                            remainingEmails: 0,
                            estimatedTimeRemaining: "Calculating...",
                            processedMessages: 0,
                            totalMessages: 0,
                        }),
                        processedMessages: data.processedMessages,
                        totalMessages: data.totalMessages,
                        estimatedTimeRemaining: calculateTimeRemaining(
                            syncInfo.syncStartTime,
                            data.progress / 100,
                        ),
                    }));

                    // Update sync info
                    setSyncInfo((prev) => ({
                        ...prev,
                        messagesProcessed: data.processedMessages,
                        totalMessages: data.totalMessages,
                        newMessageCount: data.newMessageCount || prev.newMessageCount,
                    }));
                }
                break;

            case "batch-start":
                // Update status when a new batch starts
                setStatus(
                    `${streamType === "message" ? "Processing message batch" : "Processing email batch"} ${data.batchNumber}`,
                );
                break;

            case "batch-complete":
                // Update status when a batch completes
                if (streamType === "message") {
                    setStatus(`Completed message batch ${data.batchNumber}, continuing...`);
                } else {
                    setStatus(`Completed email batch ${data.batchNumber}, continuing...`);
                }
                break;

            case "resume":
                // Update UI for resuming sync
                setStatus(
                    `Resuming previous ${streamType} sync from batch ${data.batchNumber || "last position"}`,
                );
                break;

            case "save-result":
                // Update newMessageCount for message sync
                if (streamType === "message" && data.createdCount > 0) {
                    setSyncInfo((prev) => ({
                        ...prev,
                        newMessageCount: prev.newMessageCount + data.createdCount,
                    }));
                }
                break;

            case "email-complete":
                // Increment email count in stats
                if (streamType === "email") {
                    setStats((prev) => ({
                        ...(prev || {
                            totalEmails: 0,
                            syncedEmails: 0,
                            remainingEmails: 0,
                            estimatedTimeRemaining: "Calculating...",
                            processedMessages: 0,
                            totalMessages: 0,
                        }),
                        syncedEmails: (prev?.syncedEmails || 0) + 1,
                    }));
                }
                break;

            case "complete":
                // Sync is complete
                if (streamType === "email") {
                    setSyncStage("complete");
                    setIsSyncing(false);
                    setStatus("Sync completed successfully!");
                    setProgress(100);

                    addToast({
                        variant: "success",
                        message: `Email sync completed successfully! ${syncInfo.newMessageCount} new messages found.`,
                    });

                    // Redirect to inbox after a short delay
                    setTimeout(() => {
                        addLogEntry("Redirecting to inbox");
                        router.push("/inbox");
                    }, 2000);
                }
                break;

            case "error":
                // Handle error
                setError(data.message || "An error occurred during sync");
                break;

            case "init":
                // Initialize sync info if not already set
                if (syncInfo.syncStartTime === 0) {
                    setSyncInfo((prev) => ({
                        ...prev,
                        syncStartTime: Date.now(),
                    }));
                }
                break;
        }
    };

    const calculateTimeRemaining = (startTime: number, progressFraction: number): string => {
        if (progressFraction <= 0) return "Calculating...";

        const elapsedMs = Date.now() - startTime;
        const estimatedTotalMs = elapsedMs / progressFraction;
        const remainingMs = estimatedTotalMs - elapsedMs;

        if (remainingMs < 60000) {
            return `${Math.ceil(remainingMs / 1000)} seconds`;
        }

        if (remainingMs < 3600000) {
            return `${Math.ceil(remainingMs / 60000)} minutes`;
        }

        return `${Math.ceil(remainingMs / 3600000)} hours`;
    };

    const cancelSync = useCallback(async () => {
        if (isSyncing) {
            try {
                addLogEntry("Cancelling sync...");

                // Call the API to cancel the sync
                const response = await fetch("/api/sync/messages", {
                    method: "DELETE",
                });

                if (response.ok) {
                    addLogEntry("Sync cancelled successfully");
                    setStatus("Sync cancelled by user");
                    setIsSyncing(false);
                    setSyncStage(SYNC_STAGES.IDLE);

                    addToast({
                        variant: "success",
                        message: "Sync cancelled successfully",
                    });
                } else {
                    const data = await response.json();
                    addLogEntry(
                        `Error cancelling sync: ${data.error || data.message || "Unknown error"}`,
                    );

                    addToast({
                        variant: "danger",
                        message: `Failed to cancel sync: ${data.error || data.message || "Unknown error"}`,
                    });
                }
            } catch (error) {
                addLogEntry(
                    `Error cancelling sync: ${error instanceof Error ? error.message : String(error)}`,
                );

                addToast({
                    variant: "danger",
                    message: `Failed to cancel sync: ${error instanceof Error ? error.message : String(error)}`,
                });
            }
        }
    }, [addLogEntry, addToast, isSyncing]);

    // Sync UI content based on sync state
    const renderSyncContent = () => {
        if (isSyncing) {
            return (
                <Column gap="24">
                    <Row horizontal="space-between" vertical="center">
                        <Text variant="body-strong-m">{status}</Text>
                        <Text variant="body-strong-l">{progress}%</Text>
                    </Row>

                    <ProgressBar progress={progress} />

                    {stats && (
                        <SyncStats stats={stats} syncInfo={syncInfo} currentStage={syncStage} />
                    )}

                    <Button
                        variant="danger"
                        onClick={cancelSync}
                        disabled={!isSyncing}
                        prefixIcon="close"
                    >
                        Cancel Sync
                    </Button>
                </Column>
            );
        }

        if (syncStage === SYNC_STAGES.COMPLETE) {
            return (
                <Column gap="24">
                    {stats && (
                        <SyncStats stats={stats} syncInfo={syncInfo} currentStage={syncStage} />
                    )}

                    <Button
                        variant="primary"
                        disabled={false}
                        onClick={() => router.push("/inbox")}
                    >
                        Go to Inbox
                    </Button>
                </Column>
            );
        }

        if (syncStage === SYNC_STAGES.ERROR) {
            return (
                <Column gap="24">
                    {stats && (
                        <SyncStats stats={stats} syncInfo={syncInfo} currentStage={syncStage} />
                    )}

                    <Button
                        variant="primary"
                        disabled={false}
                        onClick={() => setSyncStage(SYNC_STAGES.IDLE)}
                    >
                        Try Again
                    </Button>
                </Column>
            );
        }

        return (
            <Column gap="24" horizontal="center">
                <Icon name="inbox" size="l" color="neutral-strong" />

                <Column gap="8" horizontal="center">
                    <Text variant="body-strong-l">Sync Your Email</Text>
                    <Text variant="body-default-m" onBackground="neutral-weak">
                        Start the email sync process to download your messages.
                    </Text>
                </Column>

                <Button
                    variant="primary"
                    disabled={isSyncing}
                    onClick={startSync}
                    loading={isSyncing}
                >
                    Start Sync
                </Button>
            </Column>
        );
    };

    // Progress bar component
    const ProgressBar = ({ progress }: { progress: number }) => (
        <Row fillWidth background="neutral-alpha-weak" radius="full" height="8">
            <Row
                background="brand-medium"
                radius="full"
                height="8"
                style={{ width: `${progress}%` }}
            />
        </Row>
    );

    return (
        <Column fillWidth paddingY="80" paddingX="s" horizontal="center" flex={1}>
            <Background
                mask={{
                    x: 0,
                    y: 48,
                }}
                position="absolute"
                grid={{
                    display: true,
                    width: "0.25rem",
                    color: "neutral-alpha-medium",
                    height: "0.25rem",
                }}
            />

            <Background
                mask={{
                    x: 80,
                    y: 0,
                    radius: 100,
                }}
                position="absolute"
                gradient={{
                    display: true,
                    tilt: -35,
                    height: 50,
                    width: 75,
                    x: 100,
                    y: 40,
                    colorStart: "accent-solid-medium",
                    colorEnd: "static-transparent",
                }}
            />

            <Column
                overflow="hidden"
                as="main"
                maxWidth="l"
                position="relative"
                radius="xl"
                horizontal="center"
                border="neutral-alpha-weak"
                fillWidth
            >
                <Column
                    fillWidth
                    horizontal="center"
                    gap="48"
                    radius="xl"
                    paddingTop="80"
                    position="relative"
                >
                    <Column fillWidth horizontal="center" gap="32" padding="32" position="relative">
                        <InlineCode radius="xl" shadow="m" fit paddingX="16" paddingY="8">
                            Mail Sync
                            <Text onBackground="brand-medium" marginLeft="8">
                                Fast local email access
                            </Text>
                        </InlineCode>

                        <Heading
                            wrap="balance"
                            variant="display-strong-xl"
                            align="center"
                            marginBottom="16"
                        >
                            Sync your inbox
                        </Heading>

                        <Card
                            fillWidth
                            radius="xl"
                            overflow="hidden"
                            padding="32"
                            border="neutral-alpha-weak"
                        >
                            <Column gap="24">
                                <Text align="center">
                                    This will sync your message list from Gmail to our database.
                                    Messages are processed in batches of 500 at a time.
                                </Text>

                                <Column gap="16">
                                    <Row gap="8" vertical="center">
                                        <Icon name="inbox" size="l" />
                                        <Column>
                                            <Text variant="body-strong-m">
                                                Retrieve message list from Gmail
                                            </Text>
                                            <Text
                                                variant="body-default-s"
                                                onBackground="neutral-weak"
                                            >
                                                We'll get a list of all your message IDs (in batches
                                                of 500) and thread IDs.
                                            </Text>
                                        </Column>
                                    </Row>
                                </Column>

                                {error && (
                                    <Column
                                        background="danger-weak"
                                        radius="m"
                                        paddingY="16"
                                        paddingX="24"
                                        gap="4"
                                    >
                                        <Text variant="body-strong-m">Error</Text>
                                        <Text>{error}</Text>
                                    </Column>
                                )}

                                {renderSyncContent()}
                            </Column>
                        </Card>
                    </Column>
                </Column>

                <Column
                    horizontal="center"
                    paddingX="32"
                    paddingY="64"
                    fillWidth
                    gap="16"
                    position="relative"
                >
                    <Background
                        mask={{
                            cursor: true,
                        }}
                        dots={{
                            display: true,
                            opacity: 50,
                            color: "neutral-solid-strong",
                            size: "48",
                        }}
                        fill
                        position="absolute"
                        gradient={{
                            display: true,
                            opacity: 100,
                            tilt: 0,
                            height: 100,
                            width: 200,
                            x: 50,
                            y: 0,
                            colorStart: "neutral-background-medium",
                            colorEnd: "static-transparent",
                        }}
                    />

                    <Card fillWidth padding="32" radius="xl" border="neutral-alpha-weak">
                        <Column gap="24">
                            <Heading as="h3" variant="display-default-s">
                                About Message List Syncing
                            </Heading>

                            <Column gap="16">
                                <Row gap="16" vertical="start">
                                    <Icon name="security" size="l" />
                                    <Text>
                                        Your message metadata is encrypted before being stored in
                                        our database, ensuring your privacy and security.
                                    </Text>
                                </Row>

                                <Row gap="16" vertical="start">
                                    <Icon name="clock" size="l" />
                                    <Text>
                                        After the initial sync, we'll periodically check for new
                                        messages to keep your inbox up to date.
                                    </Text>
                                </Row>

                                <Row gap="16" vertical="start">
                                    <Icon name="lightning" size="l" />
                                    <Text>
                                        Local storage means faster access to your message list and
                                        reduced API calls to Gmail, improving performance.
                                    </Text>
                                </Row>
                            </Column>

                            <Button
                                variant="secondary"
                                onClick={() => router.push("/inbox")}
                                prefixIcon="inbox"
                            >
                                Go to Inbox
                            </Button>
                        </Column>
                    </Card>
                </Column>
            </Column>
        </Column>
    );
}
