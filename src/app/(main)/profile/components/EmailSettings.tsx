"use client";

import { Button, Card, Column, Heading, Row, Switch, Text, useToast } from "@/once-ui/components";
import { useState } from "react";

interface EmailSettingsProps {
    user: any;
}

export default function EmailSettings({ user }: EmailSettingsProps) {
    const { addToast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [settings, setSettings] = useState({
        notifyNewEmails: user?.notifyNewEmails ?? true,
        notifyReplies: user?.notifyReplies ?? true,
        notifyImportant: user?.notifyImportant ?? true,
        weeklyDigest: user?.weeklyDigest ?? false,
    });

    const handleToggle = (settingName: string) => {
        setSettings((prev) => ({
            ...prev,
            [settingName]: !prev[settingName as keyof typeof prev],
        }));
    };

    const handleSave = async () => {
        setIsLoading(true);

        try {
            // Mock API call to update user settings
            await new Promise((resolve) => setTimeout(resolve, 800));

            addToast({
                variant: "success",
                message: "Email preferences updated successfully",
            });
        } catch (error) {
            console.error("Failed to update email settings:", error);
            addToast({
                variant: "danger",
                message: "Failed to update email preferences. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Column gap="24" fill>
            <Column gap="16" fill padding="24">
                <Row fillWidth border="neutral-alpha-medium" paddingX="16" paddingY="12" radius="l">
                    <Switch
                        reverse
                        label="New email notifications"
                        description="Get notified when you receive new emails"
                        isChecked={settings.notifyNewEmails}
                        onToggle={() => handleToggle("notifyNewEmails")}
                        id="notify-new-emails"
                    />
                </Row>

                <Row fillWidth border="neutral-alpha-medium" paddingX="16" paddingY="12" radius="l">
                    <Switch
                        reverse
                        label="Reply notifications"
                        description="Receive notifications when someone replies to your emails"
                        isChecked={settings.notifyReplies}
                        onToggle={() => handleToggle("notifyReplies")}
                        id="notify-replies"
                    />
                </Row>

                <Row fillWidth border="neutral-alpha-medium" paddingX="16" paddingY="12" radius="l">
                    <Switch
                        reverse
                        label="Important email alerts"
                        description="Get notified for emails marked as important"
                        isChecked={settings.notifyImportant}
                        onToggle={() => handleToggle("notifyImportant")}
                        id="notify-important"
                    />
                </Row>

                <Row fillWidth border="neutral-alpha-medium" paddingX="16" paddingY="12" radius="l">
                    <Switch
                        reverse
                        label="Weekly digest"
                        description="Receive a weekly summary of your email activity"
                        isChecked={settings.weeklyDigest}
                        onToggle={() => handleToggle("weeklyDigest")}
                        id="weekly-digest"
                    />
                </Row>
            </Column>

            <Row
                horizontal="end"
                gap="8"
                paddingX="20"
                paddingY="12"
                borderTop="neutral-alpha-medium"
                data-border="rounded"
            >
                <Button
                    label="Save Changes"
                    variant="primary"
                    onClick={handleSave}
                    loading={isLoading}
                    disabled={isLoading}
                />
            </Row>
        </Column>
    );
}
