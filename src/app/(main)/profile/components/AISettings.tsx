"use client";

import { useState } from "react";
import {
  Card,
  Column,
  Heading,
  Text,
  Input,
  Textarea,
  Button,
  Row,
  Switch,
  Checkbox,
  Select,
  Badge,
  Spinner,
  Icon,
} from "@/once-ui/components";
import { useAISettings, useAIMetadataStats, DEFAULT_AI_SETTINGS } from "../queries";
import type { AISettings as AISettingsType } from "../queries";

interface AISettingsProps {
  user: any;
}

// Simple divider component with proper styling
const Divider = () => (
  <hr style={{ 
    width: '100%', 
    border: 'none', 
    borderTop: '1px solid var(--border-neutral-alpha-medium)',
    margin: '8px 0'
  }} />
);

export default function AISettings({ user }: AISettingsProps) {
  // Use TanStack Query hooks for data fetching and mutations
  const { 
    settings = DEFAULT_AI_SETTINGS, 
    isLoading: isLoadingSettings, 
    updateSettings,
    isUpdating
  } = useAISettings(user.id);
  
  const {
    stats: metadataStats,
    isLoading: isLoadingStats,
    clearMetadata,
    isClearing: clearingMetadata,
    runAnalysis,
    isAnalyzing: runningAnalysis
  } = useAIMetadataStats(user.id);
  
  // Local state for form management
  const [localSettings, setLocalSettings] = useState<AISettingsType | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  
  // Get the active settings (local edits or fetched settings)
  const activeSettings = localSettings || settings;

  // Initialize local settings when remote settings load
  if (!localSettings && settings) {
    setLocalSettings(settings);
  }

  const handleSettingChange = (category: keyof AISettingsType, setting: string, value: boolean) => {
    if (!localSettings) return;
    
    setLocalSettings((prev) => {
      if (!prev) return prev;
      
      const newSettings = { ...prev };
      if (category === "contentAlerts") {
        newSettings.contentAlerts = {
          ...newSettings.contentAlerts,
          [setting]: value,
        };
      } else if (category === "analysisPreferences") {
        newSettings.analysisPreferences = {
          ...newSettings.analysisPreferences,
          [setting]: value,
        };
      }
      return newSettings;
    });
  };

  const handleSimpleSetting = (setting: keyof AISettingsType, value: any) => {
    if (!localSettings) return;
    
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [setting]: value,
      };
    });
  };

  const handleAddKeyword = () => {
    if (!localSettings) return;
    
    if (newKeyword && !localSettings.priorityKeywords.includes(newKeyword)) {
      setLocalSettings((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          priorityKeywords: [...prev.priorityKeywords, newKeyword],
        };
      });
      setNewKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string) => {
    if (!localSettings) return;
    
    setLocalSettings((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        priorityKeywords: prev.priorityKeywords.filter((k: string) => k !== keyword),
      };
    });
  };

  const handleSubmit = () => {
    if (!localSettings) return;
    updateSettings(localSettings);
  };

  const handleReset = () => {
    setLocalSettings(DEFAULT_AI_SETTINGS);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Never";
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  // Show loading state while settings are being fetched
  if (isLoadingSettings) {
    return (
      <Card padding="l">
        <Column horizontal="center" vertical="center" gap="16" paddingY="32">
          <Spinner size="m" />
          <Text>Loading AI settings...</Text>
        </Column>
      </Card>
    );
  }

  return (
    <Column gap="24" fillWidth>
      {/* AI Metadata Stats Card */}
      <Card padding="l">
        <Column gap="24" fillWidth>
          <Heading variant="heading-strong-s">AI Email Analysis Data</Heading>
          
          {isLoadingStats ? (
            <Row horizontal="center" paddingY="32">
              <Column horizontal="center" gap="16">
                <Spinner size="m" />
                <Text>Loading metadata statistics...</Text>
              </Column>
            </Row>
          ) : (
            <>
              <Column gap="16" fillWidth>
                <Row horizontal="space-between" vertical="center" fillWidth>
                  <Column gap="4">
                    <Text variant="body-strong-m">Analyzed Emails</Text>
                    <Row gap="8" vertical="center">
                      <Text variant="heading-strong-l">{metadataStats?.emailsWithMetadata || 0}</Text>
                      <Text variant="body-default-s" onBackground="neutral-weak">
                        of {metadataStats?.totalEmails || 0} total emails
                      </Text>
                    </Row>
                  </Column>
                  
                  <Column gap="4" horizontal="end">
                    <Text variant="body-strong-m">Storage Used</Text>
                    <Text variant="heading-strong-m">{metadataStats?.metadataSize || "0 KB"}</Text>
                  </Column>
                </Row>
                
                <Divider />
                
                <Row horizontal="space-between" vertical="center" fillWidth>
                  <Column gap="8" width={32}>
                    <Text variant="body-strong-s">Top Priorities</Text>
                    {metadataStats?.topPriorities && metadataStats.topPriorities.length > 0 ? (
                      <Row gap="8">
                        {metadataStats.topPriorities.map((priority: any) => (
                          <Badge 
                            key={priority.label}
                            icon="star"
                            effect={false}
                          >
                            <Text variant="body-default-xs">{`${priority.label} (${priority.count})`}</Text>
                          </Badge>
                        ))}
                      </Row>
                    ) : (
                      <Text variant="body-default-s" onBackground="neutral-weak">No priority data available</Text>
                    )}
                  </Column>
                  
                  <Column gap="8" width={32}>
                    <Text variant="body-strong-s">Last Analysis</Text>
                    <Text>{formatDate(metadataStats?.lastAnalyzedDate || null)}</Text>
                  </Column>
                </Row>
                
                <Row gap="16" horizontal="space-between" fillWidth>
                  <Button
                    variant="danger"
                    label="Clear All Metadata"
                    prefixIcon="trash"
                    loading={clearingMetadata}
                    disabled={clearingMetadata || !metadataStats?.emailsWithMetadata}
                    onClick={() => clearMetadata()}
                  />
                  
                  <Button
                    variant="primary"
                    label="Analyze All Emails"
                    prefixIcon="sparkles"
                    loading={runningAnalysis}
                    disabled={runningAnalysis}
                    onClick={() => runAnalysis()}
                  />
                </Row>
              </Column>
            </>
          )}
        </Column>
      </Card>

      {/* AI Settings Card */}
      {localSettings && (
        <Card padding="l">
          <Column gap="24" fillWidth>
            <Row vertical="center" horizontal="space-between" fillWidth>
              <Heading variant="heading-strong-s">AI Email Assistant</Heading>
              <Switch
                id="ai-enabled"
                isChecked={localSettings.enabled}
                onToggle={() => handleSimpleSetting("enabled", !localSettings.enabled)}
                label={localSettings.enabled ? "Enabled" : "Disabled"}
              />
            </Row>
            
            <Text>Configure how AI analyzes and assists with your emails. These settings affect AI features throughout the application.</Text>
            
            <Divider />
            
            <Column gap="20" fillWidth>
              <Heading variant="heading-strong-xs">Custom Instructions</Heading>
              <Textarea
                label="AI Assistant Instructions"
                name="customPrompt"
                id="customPrompt"
                value={localSettings.customPrompt}
                onChange={(e) => handleSimpleSetting("customPrompt", e.target.value)}
                placeholder="Give specific instructions to the AI about how to handle your emails (e.g., 'Always highlight emails from my boss', 'Focus on identifying action items')"
                rows={4}
                disabled={!localSettings.enabled}
              />
            </Column>
            
            <Column gap="20" fillWidth>
              <Heading variant="heading-strong-xs">Priority Keywords & Senders</Heading>
              <Row gap="12" fillWidth>
                <Input
                  id="priority-keyword"
                  label="Add priority keyword or sender"
                  placeholder="Add keyword or sender email"
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  disabled={!localSettings.enabled}
                />
                <Button
                  label="Add"
                  variant="secondary"
                  onClick={handleAddKeyword}
                  disabled={!newKeyword || !localSettings.enabled}
                />
              </Row>
              
              {localSettings.priorityKeywords.length > 0 && (
                <Row gap="8">
                  {localSettings.priorityKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      icon="close"
                      effect={false}
                      onClick={() => handleRemoveKeyword(keyword)}
                    >
                      <Text variant="body-default-xs">{keyword}</Text>
                    </Badge>
                  ))}
                </Row>
              )}
            </Column>
            
            <Column gap="20" fillWidth>
              <Heading variant="heading-strong-xs">Content Alerts</Heading>
              <Text variant="body-default-s">Get notified when emails contain specific types of content</Text>
              
              <Row gap="16">
                <Column gap="12" width={24}>
                  <Checkbox
                    id="urgent-requests"
                    label="Urgent Requests"
                    isChecked={localSettings.contentAlerts.urgentRequests}
                    onToggle={() => handleSettingChange("contentAlerts", "urgentRequests", !localSettings.contentAlerts.urgentRequests)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="financial-content"
                    label="Financial Content"
                    isChecked={localSettings.contentAlerts.financialContent}
                    onToggle={() => handleSettingChange("contentAlerts", "financialContent", !localSettings.contentAlerts.financialContent)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="deadlines"
                    label="Deadlines"
                    isChecked={localSettings.contentAlerts.deadlines}
                    onToggle={() => handleSettingChange("contentAlerts", "deadlines", !localSettings.contentAlerts.deadlines)}
                    disabled={!localSettings.enabled}
                  />
                </Column>
                
                <Column gap="12" width={24}>
                  <Checkbox
                    id="meetings"
                    label="Meeting Requests"
                    isChecked={localSettings.contentAlerts.meetings}
                    onToggle={() => handleSettingChange("contentAlerts", "meetings", !localSettings.contentAlerts.meetings)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="legal-documents"
                    label="Legal Documents"
                    isChecked={localSettings.contentAlerts.legalDocuments}
                    onToggle={() => handleSettingChange("contentAlerts", "legalDocuments", !localSettings.contentAlerts.legalDocuments)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="personal-info"
                    label="Personal Information"
                    isChecked={localSettings.contentAlerts.personalInfo}
                    onToggle={() => handleSettingChange("contentAlerts", "personalInfo", !localSettings.contentAlerts.personalInfo)}
                    disabled={!localSettings.enabled}
                  />
                </Column>
              </Row>
            </Column>
            
            <Column gap="20" fillWidth>
              <Heading variant="heading-strong-xs">Email Analysis</Heading>
              <Text variant="body-default-s">Configure how AI analyzes your emails</Text>
              
              <Row gap="16">
                <Column gap="12" width={24}>
                  <Checkbox
                    id="summarize"
                    label="Generate Summaries"
                    isChecked={localSettings.analysisPreferences.summarize}
                    onToggle={() => handleSettingChange("analysisPreferences", "summarize", !localSettings.analysisPreferences.summarize)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="categorize"
                    label="Smart Categorization"
                    isChecked={localSettings.analysisPreferences.categorize}
                    onToggle={() => handleSettingChange("analysisPreferences", "categorize", !localSettings.analysisPreferences.categorize)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="extract-actions"
                    label="Extract Action Items"
                    isChecked={localSettings.analysisPreferences.extractActions}
                    onToggle={() => handleSettingChange("analysisPreferences", "extractActions", !localSettings.analysisPreferences.extractActions)}
                    disabled={!localSettings.enabled}
                  />
                </Column>
                
                <Column gap="12" width={24}>
                  <Checkbox
                    id="detect-sentiment"
                    label="Detect Sentiment"
                    isChecked={localSettings.analysisPreferences.detectSentiment}
                    onToggle={() => handleSettingChange("analysisPreferences", "detectSentiment", !localSettings.analysisPreferences.detectSentiment)}
                    disabled={!localSettings.enabled}
                  />
                  <Checkbox
                    id="highlight-important"
                    label="Highlight Important Parts"
                    isChecked={localSettings.analysisPreferences.highlightImportant}
                    onToggle={() => handleSettingChange("analysisPreferences", "highlightImportant", !localSettings.analysisPreferences.highlightImportant)}
                    disabled={!localSettings.enabled}
                  />
                </Column>
              </Row>
            </Column>
            
            <Column gap="12" fillWidth>
              <Heading variant="heading-strong-xs">AI Assistant Level</Heading>
              <Select
                id="ai-assist-level"
                label="Choose how proactive the AI assistant should be"
                value={localSettings.aiAssistLevel}
                onChange={(e) => handleSimpleSetting("aiAssistLevel", e.target.value)}
                disabled={!localSettings.enabled}
                options={[
                  { value: "minimal", label: "Minimal - Only when I explicitly ask" },
                  { value: "balanced", label: "Balanced - Helpful suggestions when relevant" },
                  { value: "proactive", label: "Proactive - Actively offer assistance" },
                ]}
              />
            </Column>
            
            <Row gap="16" horizontal="space-between" fillWidth>
              <Checkbox
                id="preserve-metadata"
                label="Preserve email metadata for AI analysis"
                isChecked={localSettings.preserveMetadata}
                onToggle={() => handleSimpleSetting("preserveMetadata", !localSettings.preserveMetadata)}
                disabled={!localSettings.enabled}
              />
              
              <Button
                label="Reset to Defaults"
                variant="tertiary"
                onClick={handleReset}
                disabled={isUpdating}
              />
            </Row>
            
            <Row horizontal="end" gap="16">
              <Button
                label="Save Preferences"
                variant="primary"
                onClick={handleSubmit}
                loading={isUpdating}
                disabled={isUpdating || !localSettings.enabled}
              />
            </Row>
          </Column>
        </Card>
      )}
    </Column>
  );
} 

 