"use client";

import { useState } from "react";
import {
  Card,
  Column,
  Heading,
  Text,
  Switch,
  Button,
  Row,
  useToast,
} from "@/once-ui/components";

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
    setSettings(prev => ({
      ...prev,
      [settingName]: !prev[settingName as keyof typeof prev],
    }));
  };

  const handleSave = async () => {
    setIsLoading(true);
    
    try {
      // Mock API call to update user settings
      await new Promise(resolve => setTimeout(resolve, 800));
      
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
    <Card padding="l">
      <Column gap="24" fillWidth>
        <Heading variant="heading-strong-s">Email Notifications</Heading>
        
        <Column gap="16" fillWidth>
          <Text variant="body-default-m">
            Control which email notifications you receive from Mailer
          </Text>
          
          <Row gap="8" vertical="center" horizontal="space-between">
            <Column gap="4">
              <Text variant="body-strong-m">New email notifications</Text>
              <Text variant="body-default-s" onBackground="neutral-medium">
                Get notified when you receive new emails
              </Text>
            </Column>
            <Switch 
              isChecked={settings.notifyNewEmails}
              onToggle={() => handleToggle("notifyNewEmails")}
              id="notify-new-emails"
            />
          </Row>
          
          <Row gap="8" vertical="center" horizontal="space-between">
            <Column gap="4">
              <Text variant="body-strong-m">Reply notifications</Text>
              <Text variant="body-default-s" onBackground="neutral-medium">
                Receive notifications when someone replies to your emails
              </Text>
            </Column>
            <Switch 
              isChecked={settings.notifyReplies}
              onToggle={() => handleToggle("notifyReplies")}
              id="notify-replies"
            />
          </Row>
          
          <Row gap="8" vertical="center" horizontal="space-between">
            <Column gap="4">
              <Text variant="body-strong-m">Important email alerts</Text>
              <Text variant="body-default-s" onBackground="neutral-medium">
                Get notified for emails marked as important
              </Text>
            </Column>
            <Switch 
              isChecked={settings.notifyImportant}
              onToggle={() => handleToggle("notifyImportant")}
              id="notify-important"
            />
          </Row>
          
          <Row gap="8" vertical="center" horizontal="space-between">
            <Column gap="4">
              <Text variant="body-strong-m">Weekly digest</Text>
              <Text variant="body-default-s" onBackground="neutral-medium">
                Receive a weekly summary of your email activity
              </Text>
            </Column>
            <Switch 
              isChecked={settings.weeklyDigest}
              onToggle={() => handleToggle("weeklyDigest")}
              id="weekly-digest"
            />
          </Row>
        </Column>
        
        <Row horizontal="end">
          <Button
            label="Save Preferences"
            variant="primary"
            onClick={handleSave}
            loading={isLoading}
            disabled={isLoading}
          />
        </Row>
      </Column>
    </Card>
  );
} 