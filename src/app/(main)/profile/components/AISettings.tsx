"use client";

import {
    Button,
    Checkbox,
    Column,
    Heading,
    Kbd,
    Row,
    Select,
    Spinner,
    Switch,
    Tag,
    TagInput,
    Text,
    Textarea,
} from "@/once-ui/components";
import type { User } from "better-auth";
import { useEffect, useState } from "react";
import {
    type AISettings as AISettingsType,
    DEFAULT_AI_SETTINGS,
    useAIMetadataStats,
    useAISettings,
} from "../queries";

// Format date as relative time
const formatDistanceToNow = (date: Date): string => {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? "s" : ""} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? "s" : ""} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? "s" : ""} ago`;

    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? "s" : ""} ago`;

    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears !== 1 ? "s" : ""} ago`;
};

export default function AISettings({ user }: { user: User }) {
    const userId = user.id;

    const {
        settings,
        isLoading: isLoadingSettings,
        updateSettings,
        isUpdating,
    } = useAISettings(userId);

    const {
        stats: metadataStats,
        isLoading: isLoadingStats,
        clearMetadata,
        isClearing,
        runAnalysis,
        isAnalyzing,
    } = useAIMetadataStats(userId);

    const [localSettings, setLocalSettings] = useState<AISettingsType | null>(null);
    const [activeTab, setActiveTab] = useState("preferences");

    // Initialize local settings when the data is loaded
    useEffect(() => {
        if (settings && !localSettings) {
            setLocalSettings(settings);
        }
    }, [settings, localSettings]);

    // Handle toggling a boolean setting
    const handleToggle = (section: string, setting: string) => {
        if (!localSettings) return;

        setLocalSettings((prev) => {
            if (!prev) return prev;

            if (section === "root") {
                return { ...prev, [setting]: !prev[setting as keyof typeof prev] };
            }

            // For nested settings using the content alerts or analysis preferences
            if (section === "contentAlerts" && typeof prev.contentAlerts === "object") {
                return {
                    ...prev,
                    contentAlerts: {
                        ...prev.contentAlerts,
                        [setting]: !prev.contentAlerts[setting as keyof typeof prev.contentAlerts],
                    },
                };
            }

            if (section === "analysisPreferences" && typeof prev.analysisPreferences === "object") {
                return {
                    ...prev,
                    analysisPreferences: {
                        ...prev.analysisPreferences,
                        [setting]:
                            !prev.analysisPreferences[
                                setting as keyof typeof prev.analysisPreferences
                            ],
                    },
                };
            }

            return prev;
        });
    };

    // Handle changing the value of a setting
    const handleChange = (section: string, setting: string, value: string) => {
        if (!localSettings) return;

        setLocalSettings((prev) => {
            if (!prev) return prev;

            if (section === "root") {
                return { ...prev, [setting]: value };
            }

            // We don't have any nested string settings to change currently
            return prev;
        });
    };

    // Submit settings update
    const submitSettings = () => {
        if (localSettings) {
            updateSettings(localSettings);
        }
    };

    // Reset to default settings
    const resetToDefaults = () => {
        setLocalSettings(DEFAULT_AI_SETTINGS);
    };

    if (isLoadingSettings) {
        return (
            <Column fill center padding="24">
                <Spinner size="m" />
            </Column>
        );
    }

    if (!localSettings) {
        return (
            <Column fill center padding="24">
                <Text>Failed to load settings. Please refresh.</Text>
            </Column>
        );
    }

    const renderTabContent = () => {
        switch (activeTab) {
            case "preferences":
                return (
                    <Column gap="24" paddingX="24" fill>
                        <Row
                            fillWidth
                            border="neutral-alpha-medium"
                            paddingX="16"
                            paddingY="12"
                            radius="l"
                        >
                            <Switch
                                reverse
                                id="preserve-metadata"
                                label="Preserve email analysis metadata"
                                isChecked={localSettings.preserveMetadata}
                                onToggle={() => handleToggle("root", "preserveMetadata")}
                                disabled={!localSettings.enabled}
                                description="Store email content as vectors for AI search (all email content is encrypted at rest)"
                            />
                        </Row>

                        <Textarea
                            labelAsPlaceholder
                            id="custom-prompt"
                            label="AI instructions"
                            description="Add specific instructions for the AI when analyzing emails"
                            value={localSettings.customPrompt}
                            onChange={(e) => handleChange("root", "customPrompt", e.target.value)}
                            lines="auto"
                            disabled={!localSettings.enabled}
                        />

                        <TagInput
                            id="priority-keyword"
                            label="Add priority keywords"
                            description="Add specific keywords that the AI should prioritize when analyzing emails"
                            hasSuffix={<Kbd>Enter</Kbd>}
                            value={localSettings.priorityKeywords}
                            onChange={(keywords) =>
                                setLocalSettings((prev) => {
                                    if (!prev) return prev;
                                    return { ...prev, priorityKeywords: keywords };
                                })
                            }
                            disabled={!localSettings.enabled}
                        />
                    </Column>
                );

            case "alerts":
                return (
                    <Column gap="24" fillWidth paddingX="24" paddingTop="8">
                        <Text variant="body-default-m">
                            Get notified when emails contain specific types of content
                        </Text>

                        <Row gap="16">
                            <Column gap="12" width={24}>
                                <Checkbox
                                    id="urgent-requests"
                                    label="Urgent Requests"
                                    isChecked={localSettings.contentAlerts.urgentRequests}
                                    onToggle={() => handleToggle("contentAlerts", "urgentRequests")}
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="financial-content"
                                    label="Financial Content"
                                    isChecked={localSettings.contentAlerts.financialContent}
                                    onToggle={() =>
                                        handleToggle("contentAlerts", "financialContent")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="deadlines"
                                    label="Deadlines"
                                    isChecked={localSettings.contentAlerts.deadlines}
                                    onToggle={() => handleToggle("contentAlerts", "deadlines")}
                                    disabled={!localSettings.enabled}
                                />
                            </Column>

                            <Column gap="12" width={24}>
                                <Checkbox
                                    id="meetings"
                                    label="Meeting Requests"
                                    isChecked={localSettings.contentAlerts.meetings}
                                    onToggle={() => handleToggle("contentAlerts", "meetings")}
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="legal-documents"
                                    label="Legal Documents"
                                    isChecked={localSettings.contentAlerts.legalDocuments}
                                    onToggle={() => handleToggle("contentAlerts", "legalDocuments")}
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="personal-info"
                                    label="Personal Information"
                                    isChecked={localSettings.contentAlerts.personalInfo}
                                    onToggle={() => handleToggle("contentAlerts", "personalInfo")}
                                    disabled={!localSettings.enabled}
                                />
                            </Column>
                        </Row>
                    </Column>
                );

            case "analysis":
                return (
                    <Column gap="24" fillWidth paddingX="24" paddingTop="8">
                        <Text variant="body-default-m">Configure how AI analyzes your emails</Text>

                        <Row gap="16">
                            <Column gap="12" width={24}>
                                <Checkbox
                                    id="summarize"
                                    label="Generate Summaries"
                                    isChecked={localSettings.analysisPreferences.summarize}
                                    onToggle={() =>
                                        handleToggle("analysisPreferences", "summarize")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="categorize"
                                    label="Smart Categorization"
                                    isChecked={localSettings.analysisPreferences.categorize}
                                    onToggle={() =>
                                        handleToggle("analysisPreferences", "categorize")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="extract-actions"
                                    label="Extract Action Items"
                                    isChecked={localSettings.analysisPreferences.extractActions}
                                    onToggle={() =>
                                        handleToggle("analysisPreferences", "extractActions")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                            </Column>

                            <Column gap="12" width={24}>
                                <Checkbox
                                    id="detect-sentiment"
                                    label="Detect Sentiment"
                                    isChecked={localSettings.analysisPreferences.detectSentiment}
                                    onToggle={() =>
                                        handleToggle("analysisPreferences", "detectSentiment")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                                <Checkbox
                                    id="highlight-important"
                                    label="Highlight Important Parts"
                                    isChecked={localSettings.analysisPreferences.highlightImportant}
                                    onToggle={() =>
                                        handleToggle("analysisPreferences", "highlightImportant")
                                    }
                                    disabled={!localSettings.enabled}
                                />
                            </Column>
                        </Row>
                    </Column>
                );

            case "stats":
                return (
                    <Column gap="24" fillWidth paddingX="24" paddingTop="8">
                        {isLoadingStats ? (
                            <Row horizontal="center" paddingY="32">
                                <Column horizontal="center" gap="16">
                                    <Spinner size="m" />
                                </Column>
                            </Row>
                        ) : !metadataStats ? (
                            <Row horizontal="center" paddingY="32">
                                <Text onBackground="neutral-weak">No statistics available</Text>
                            </Row>
                        ) : (
                            <>
                                <Column gap="16" fillWidth>
                                    <Row
                                        horizontal="space-between"
                                        vertical="center"
                                        fillWidth
                                        gap="8"
                                    >
                                        <Column
                                            gap="4"
                                            horizontal="center"
                                            fillWidth
                                            radius="l"
                                            border="neutral-alpha-medium"
                                            padding="12"
                                        >
                                            <Row gap="8" vertical="center">
                                                <Text variant="heading-strong-l">
                                                    {metadataStats.emailsWithMetadata}
                                                </Text>
                                                <Text
                                                    variant="body-default-s"
                                                    onBackground="neutral-weak"
                                                >
                                                    of {metadataStats.totalEmails}
                                                </Text>
                                            </Row>
                                            <Text
                                                variant="label-default-s"
                                                onBackground="neutral-weak"
                                            >
                                                Analyzed Emails
                                            </Text>
                                        </Column>

                                        <Column
                                            gap="4"
                                            horizontal="center"
                                            fillWidth
                                            radius="l"
                                            border="neutral-alpha-medium"
                                            padding="12"
                                        >
                                            <Text variant="heading-strong-m">
                                                {metadataStats.metadataSize}
                                            </Text>
                                            <Text
                                                variant="label-default-s"
                                                onBackground="neutral-weak"
                                            >
                                                Storage Used
                                            </Text>
                                        </Column>

                                        <Column
                                            gap="4"
                                            horizontal="center"
                                            fillWidth
                                            radius="l"
                                            border="neutral-alpha-medium"
                                            padding="12"
                                        >
                                            <Text variant="heading-strong-m">
                                                {metadataStats.lastAnalyzedDate
                                                    ? formatDistanceToNow(
                                                          new Date(metadataStats.lastAnalyzedDate),
                                                      )
                                                    : "Never"}
                                            </Text>
                                            <Text
                                                variant="label-default-s"
                                                onBackground="neutral-weak"
                                            >
                                                Last Analysis
                                            </Text>
                                        </Column>
                                    </Row>

                                    <Row
                                        horizontal="space-between"
                                        vertical="center"
                                        fillWidth
                                        marginTop="16"
                                    >
                                        <Column gap="8" fillWidth>
                                            <Text
                                                variant="label-default-s"
                                                onBackground="neutral-weak"
                                            >
                                                Top Priorities
                                            </Text>
                                            {metadataStats?.topPriorities?.length > 0 ? (
                                                <Row gap="8">
                                                    {metadataStats.topPriorities.map((priority) => (
                                                        <Tag key={priority.label} size="l">
                                                            <Row
                                                                textVariant="body-default-xs"
                                                                gap="8"
                                                                vertical="center"
                                                            >
                                                                {priority.label}{" "}
                                                                <Kbd
                                                                    style={{
                                                                        marginRight: "-0.75rem",
                                                                    }}
                                                                    data-border="rounded"
                                                                    data-scaling="90"
                                                                >
                                                                    {priority.count}
                                                                </Kbd>
                                                            </Row>
                                                        </Tag>
                                                    ))}
                                                </Row>
                                            ) : (
                                                <Text
                                                    variant="body-default-s"
                                                    onBackground="neutral-weak"
                                                >
                                                    No priority data available
                                                </Text>
                                            )}
                                        </Column>
                                    </Row>
                                    <Column fillWidth gap="12" marginTop="16">
                                        <Text variant="label-default-s" onBackground="neutral-weak">
                                            Manage
                                        </Text>
                                        <Row gap="16" fillWidth>
                                            <Button
                                                data-border="rounded"
                                                size="s"
                                                variant="danger"
                                                label="Clear all metadata"
                                                prefixIcon="trash"
                                                loading={isClearing}
                                                disabled={
                                                    isClearing ||
                                                    isAnalyzing ||
                                                    metadataStats?.emailsWithMetadata === 0
                                                }
                                                onClick={() => clearMetadata()}
                                            />

                                            <Button
                                                data-border="rounded"
                                                size="s"
                                                label="Analyze All Emails"
                                                prefixIcon="sparkles"
                                                loading={isAnalyzing}
                                                disabled={isClearing || isAnalyzing}
                                                onClick={() => runAnalysis()}
                                            />
                                        </Row>
                                    </Column>
                                </Column>
                            </>
                        )}
                    </Column>
                );

            default:
                return null;
        }
    };

    return (
        <Column fill>
            <Row fillWidth padding="24" borderBottom="neutral-medium">
                <Switch
                    reverse
                    id="ai-enabled"
                    isChecked={localSettings.enabled}
                    onToggle={() => handleToggle("root", "enabled")}
                    label="AI Email Assistant"
                    description="The AI assistant analyzes your emails and provides insights and recommendations."
                />
            </Row>

            {localSettings?.enabled ? (
                <Column fill>
                    <Row
                        gap="4"
                        fillWidth
                        data-border="rounded"
                        paddingX="24"
                        paddingTop="24"
                        paddingBottom="16"
                        horizontal="center"
                    >
                        <Button
                            size="s"
                            weight={activeTab === "preferences" ? "strong" : "default"}
                            variant={activeTab === "preferences" ? "primary" : "secondary"}
                            label="Preferences"
                            onClick={() => setActiveTab("preferences")}
                        />
                        <Button
                            size="s"
                            weight={activeTab === "alerts" ? "strong" : "default"}
                            variant={activeTab === "alerts" ? "primary" : "secondary"}
                            label="Content Alerts"
                            onClick={() => setActiveTab("alerts")}
                        />
                        <Button
                            size="s"
                            weight={activeTab === "analysis" ? "strong" : "default"}
                            variant={activeTab === "analysis" ? "primary" : "secondary"}
                            label="Analysis"
                            onClick={() => setActiveTab("analysis")}
                        />
                        <Button
                            size="s"
                            weight={activeTab === "stats" ? "strong" : "default"}
                            variant={activeTab === "stats" ? "primary" : "secondary"}
                            label="Statistics"
                            onClick={() => setActiveTab("stats")}
                        />
                    </Row>
                    {renderTabContent()}
                </Column>
            ) : (
                <Row fill />
            )}

            <Row
                horizontal="end"
                gap="8"
                paddingX="20"
                paddingY="12"
                borderTop="neutral-alpha-medium"
                data-border="rounded"
            >
                <Button
                    label="Cancel"
                    variant="secondary"
                    onClick={resetToDefaults}
                    disabled={isUpdating}
                />

                <Button
                    label="Save Changes"
                    variant="primary"
                    onClick={submitSettings}
                    loading={isUpdating}
                    disabled={isUpdating || !localSettings.enabled}
                />
            </Row>
        </Column>
    );
}
