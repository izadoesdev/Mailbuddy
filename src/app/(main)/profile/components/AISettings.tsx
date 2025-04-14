"use client";

import { useState, useEffect } from "react";
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
import { useAISettings, useAIMetadataStats, type AISettings as AISettingsType, DEFAULT_AI_SETTINGS } from "../queries";
import type { User } from "better-auth";


// Simple divider component with proper styling
const Divider = () => (
  <hr style={{ 
    width: '100%', 
    border: 'none', 
    borderTop: '1px solid var(--border-neutral-alpha-medium)',
    margin: '8px 0'
  }} />
);

// Format date as relative time
const formatDistanceToNow = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes !== 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours !== 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays !== 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths !== 1 ? 's' : ''} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears !== 1 ? 's' : ''} ago`;
};

export default function AISettings({ user }: { user: User }) {
  const userId = user.id;
  
  const { 
    settings, 
    isLoading: isLoadingSettings, 
    updateSettings, 
    isUpdating 
  } = useAISettings(userId);
  
  const { 
    stats: metadataStats, 
    isLoading: isLoadingStats, 
    clearMetadata, 
    isClearing, 
    runAnalysis, 
    isAnalyzing 
  } = useAIMetadataStats(userId);

  const [localSettings, setLocalSettings] = useState<AISettingsType | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
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
    
    setLocalSettings(prev => {
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
            [setting]: !prev.contentAlerts[setting as keyof typeof prev.contentAlerts]
          }
        };
      }
      
      if (section === "analysisPreferences" && typeof prev.analysisPreferences === "object") {
        return {
          ...prev,
          analysisPreferences: {
            ...prev.analysisPreferences,
            [setting]: !prev.analysisPreferences[setting as keyof typeof prev.analysisPreferences]
          }
        };
      }
      
      return prev;
    });
  };

  // Handle changing the value of a setting
  const handleChange = (section: string, setting: string, value: string) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => {
      if (!prev) return prev;
      
      if (section === "root") {
        return { ...prev, [setting]: value };
      } 
      
      // We don't have any nested string settings to change currently
      return prev;
    });
  };

  // Add a keyword to priority keywords
  const addKeyword = () => {
    if (!newKeyword.trim() || !localSettings) return;
    
    setLocalSettings(prev => {
      if (!prev) return prev;
      
      const keywords = [...prev.priorityKeywords];
      if (!keywords.includes(newKeyword.trim())) {
        keywords.push(newKeyword.trim());
      }
      return { ...prev, priorityKeywords: keywords };
    });
    
    setNewKeyword("");
  };

  // Remove a keyword from priority keywords
  const removeKeyword = (keyword: string) => {
    if (!localSettings) return;
    
    setLocalSettings(prev => {
      if (!prev) return prev;
      
      return {
        ...prev,
        priorityKeywords: prev.priorityKeywords.filter(k => k !== keyword),
      };
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
      <Card padding="l">
        <Column horizontal="center" vertical="center" gap="16" paddingY="32">
          <Spinner size="m" />
          <Text>Loading AI settings...</Text>
        </Column>
      </Card>
    );
  }

  if (!localSettings) {
    return (
      <Card padding="l">
        <Column horizontal="center" vertical="center" gap="16" paddingY="32">
          <Text>Failed to load settings. Please refresh.</Text>
        </Column>
      </Card>
    );
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'preferences':
        return (
          <Column gap="24" fillWidth>
            <Column gap="16">
              <Heading variant="heading-strong-xs">AI Assistance Level</Heading>
              <Select
                id="ai-assist-level"
                label="Choose how proactive the AI assistant should be"
                value={localSettings.aiAssistLevel}
                onChange={(e) => handleChange("root", "aiAssistLevel", e.target.value)}
                disabled={!localSettings.enabled}
                options={[
                  { value: "minimal", label: "Minimal - Only when I explicitly ask" },
                  { value: "balanced", label: "Balanced - Helpful suggestions when relevant" },
                  { value: "proactive", label: "Proactive - Actively offer assistance" },
                ]}
              />
            </Column>

            <Column gap="16">
              <Row vertical="center" gap="8">
                <Switch
                  id="preserve-metadata"
                  isChecked={localSettings.preserveMetadata}
                  onToggle={() => handleToggle("root", "preserveMetadata")}
                  disabled={!localSettings.enabled}
                />
                <Text>Preserve email analysis metadata</Text>
              </Row>
              <Text variant="body-default-xs" onBackground="neutral-weak">
                When enabled, the AI will store analysis information for faster access
              </Text>
            </Column>

            <Column gap="16">
              <Heading variant="heading-strong-xs">Custom Analysis Prompt</Heading>
              <Textarea
                id="custom-prompt"
                label="Advanced Instructions"
                placeholder="Add specific instructions for the AI when analyzing emails..."
                value={localSettings.customPrompt}
                onChange={(e) => handleChange("root", "customPrompt", e.target.value)}
                rows={3}
                disabled={!localSettings.enabled}
              />
            </Column>

            <Column gap="16">
              <Heading variant="heading-strong-xs">Priority Keywords</Heading>
              <Row gap="12" fillWidth>
                <Input
                  id="priority-keyword"
                  label="Add priority keyword"
                  placeholder="Add priority keyword..."
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                  disabled={!localSettings.enabled}
                />
                <Button
                  variant="secondary"
                  label="Add"
                  onClick={addKeyword}
                  disabled={!localSettings.enabled || !newKeyword.trim()}
                />
              </Row>

              {localSettings.priorityKeywords.length > 0 && (
                <Row gap="8">
                  {localSettings.priorityKeywords.map((keyword) => (
                    <Badge
                      key={keyword}
                      icon="close"
                      effect={false}
                      onClick={() => removeKeyword(keyword)}
                    >
                      <Text variant="body-default-xs">{keyword}</Text>
                    </Badge>
                  ))}
                </Row>
              )}
              {localSettings.priorityKeywords.length === 0 && (
                <Text variant="body-default-s" onBackground="neutral-weak">No priority keywords set</Text>
              )}
            </Column>
          </Column>
        );
      
      case 'alerts':
        return (
          <Column gap="24" fillWidth>
            <Heading variant="heading-strong-xs">Content Alerts</Heading>
            <Text variant="body-default-s">Get notified when emails contain specific types of content</Text>

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
                  onToggle={() => handleToggle("contentAlerts", "financialContent")}
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
      
      case 'analysis':
        return (
          <Column gap="24" fillWidth>
            <Heading variant="heading-strong-xs">Email Analysis</Heading>
            <Text variant="body-default-s">Configure how AI analyzes your emails</Text>

            <Row gap="16">
              <Column gap="12" width={24}>
                <Checkbox
                  id="summarize"
                  label="Generate Summaries"
                  isChecked={localSettings.analysisPreferences.summarize}
                  onToggle={() => handleToggle("analysisPreferences", "summarize")}
                  disabled={!localSettings.enabled}
                />
                <Checkbox
                  id="categorize"
                  label="Smart Categorization"
                  isChecked={localSettings.analysisPreferences.categorize}
                  onToggle={() => handleToggle("analysisPreferences", "categorize")}
                  disabled={!localSettings.enabled}
                />
                <Checkbox
                  id="extract-actions"
                  label="Extract Action Items"
                  isChecked={localSettings.analysisPreferences.extractActions}
                  onToggle={() => handleToggle("analysisPreferences", "extractActions")}
                  disabled={!localSettings.enabled}
                />
              </Column>

              <Column gap="12" width={24}>
                <Checkbox
                  id="detect-sentiment"
                  label="Detect Sentiment"
                  isChecked={localSettings.analysisPreferences.detectSentiment}
                  onToggle={() => handleToggle("analysisPreferences", "detectSentiment")}
                  disabled={!localSettings.enabled}
                />
                <Checkbox
                  id="highlight-important"
                  label="Highlight Important Parts"
                  isChecked={localSettings.analysisPreferences.highlightImportant}
                  onToggle={() => handleToggle("analysisPreferences", "highlightImportant")}
                  disabled={!localSettings.enabled}
                />
              </Column>
            </Row>
          </Column>
        );
      
      case 'stats':
        return (
          <Column gap="24" fillWidth>
            {isLoadingStats ? (
              <Row horizontal="center" paddingY="32">
                <Column horizontal="center" gap="16">
                  <Spinner size="m" />
                  <Text>Loading metadata statistics...</Text>
                </Column>
              </Row>
            ) : !metadataStats ? (
              <Row horizontal="center" paddingY="32">
                <Text onBackground="neutral-weak">No statistics available</Text>
              </Row>
            ) : (
              <>
                <Column gap="16" fillWidth>
                  <Row horizontal="space-between" vertical="center" fillWidth>
                    <Column gap="4">
                      <Text variant="body-strong-m">Analyzed Emails</Text>
                      <Row gap="8" vertical="center">
                        <Text variant="heading-strong-l">{metadataStats.emailsWithMetadata}</Text>
                        <Text variant="body-default-s" onBackground="neutral-weak">
                          of {metadataStats.totalEmails} total emails
                        </Text>
                      </Row>
                    </Column>
                    
                    <Column gap="4" horizontal="end">
                      <Text variant="body-strong-m">Storage Used</Text>
                      <Text variant="heading-strong-m">{metadataStats.metadataSize}</Text>
                    </Column>
                  </Row>
                  
                  <Divider />
                  
                  <Row horizontal="space-between" vertical="center" fillWidth>
                    <Column gap="8" width={32}>
                      <Text variant="body-strong-s">Top Priorities</Text>
                      {metadataStats.topPriorities && metadataStats.topPriorities.length > 0 ? (
                        <Row gap="8">
                          {metadataStats.topPriorities.map((priority) => (
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
                      <Text>
                        {metadataStats.lastAnalyzedDate
                          ? formatDistanceToNow(new Date(metadataStats.lastAnalyzedDate))
                          : "Never"}
                      </Text>
                    </Column>
                  </Row>
                  
                  <Row gap="16" horizontal="space-between" fillWidth>
                    <Button
                      variant="danger"
                      label="Clear All Metadata"
                      prefixIcon="trash"
                      loading={isClearing}
                      disabled={isClearing || isAnalyzing || metadataStats.emailsWithMetadata === 0}
                      onClick={() => clearMetadata()}
                    />
                    
                    <Button
                      variant="primary"
                      label="Analyze All Emails"
                      prefixIcon="sparkles"
                      loading={isAnalyzing}
                      disabled={isClearing || isAnalyzing}
                      onClick={() => runAnalysis()}
                    />
                  </Row>
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
    <Column gap="24" fillWidth>
      <Card padding="l">
        <Column gap="24" fillWidth>
          <Row vertical="center" horizontal="space-between" fillWidth>
            <Heading variant="heading-strong-s">AI Email Assistant</Heading>
            <Switch
              id="ai-enabled"
              isChecked={localSettings.enabled}
              onToggle={() => handleToggle("root", "enabled")}
              label={localSettings.enabled ? "Enabled" : "Disabled"}
            />
          </Row>

          <Text>Configure how AI analyzes and assists with your emails. These settings affect AI features throughout the application.</Text>
          
          <Divider />
          
          <Row gap="8" fillWidth>
            <Button
              variant={activeTab === 'preferences' ? 'primary' : 'secondary'}
              label="Preferences"
              onClick={() => setActiveTab('preferences')}
            />
            <Button
              variant={activeTab === 'alerts' ? 'primary' : 'secondary'}
              label="Content Alerts"
              onClick={() => setActiveTab('alerts')}
            />
            <Button
              variant={activeTab === 'analysis' ? 'primary' : 'secondary'}
              label="Analysis"
              onClick={() => setActiveTab('analysis')}
            />
            <Button
              variant={activeTab === 'stats' ? 'primary' : 'secondary'}
              label="Statistics"
              onClick={() => setActiveTab('stats')}
            />
          </Row>
          
          {renderTabContent()}
          
          <Row horizontal="space-between" gap="16">
            <Button
              label="Reset to Defaults"
              variant="tertiary"
              onClick={resetToDefaults}
              disabled={isUpdating}
            />
            
            <Button
              label="Save Preferences"
              variant="primary"
              onClick={submitSettings}
              loading={isUpdating}
              disabled={isUpdating || !localSettings.enabled}
            />
          </Row>
        </Column>
      </Card>
    </Column>
  );
}