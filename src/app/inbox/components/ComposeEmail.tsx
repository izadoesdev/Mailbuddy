import { useState, useRef, useEffect } from "react";
import {
  Button,
  Card,
  Column,
  Input,
  Row,
  Text,
  IconButton,
  useToast,
  Dropdown,
  DropdownWrapper,
  Chip,
  Icon,
} from "@/once-ui/components";
import { useEmailMutations } from "../hooks/useEmailMutations";

interface ComposeEmailProps {
  threadId?: string;
  initialTo?: string;
  initialSubject?: string;
  initialBody?: string;
  onClose: () => void;
  onSuccess?: () => void;
}

type EnhancementType = "improve" | "shorten" | "formal" | "friendly";

export function ComposeEmail({
  threadId,
  initialTo = "",
  initialSubject = "",
  initialBody = "",
  onClose,
  onSuccess,
}: ComposeEmailProps) {
  const [to, setTo] = useState(initialTo);
  const [cc, setCc] = useState("");
  const [bcc, setBcc] = useState("");
  const [subject, setSubject] = useState(initialSubject);
  const [body, setBody] = useState(initialBody);
  const [showCcBcc, setShowCcBcc] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  // Enhancement states
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedContent, setEnhancedContent] = useState("");
  const [showEnhancementOptions, setShowEnhancementOptions] = useState(false);
  const [enhancementType, setEnhancementType] = useState<EnhancementType>("improve");
  const [selectedText, setSelectedText] = useState("");
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);
  
  const bodyRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();
  
  const { sendEmail } = useEmailMutations();

  // Set up contentEditable div as rich text editor
  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.contentEditable = "true";
      bodyRef.current.innerHTML = initialBody;
      bodyRef.current.focus();
    }
  }, [initialBody]);

  // Handle body changes from contentEditable div
  const handleBodyChange = () => {
    if (bodyRef.current) {
      setBody(bodyRef.current.innerHTML);
    }
  };

  // Handle text selection
  const handleTextSelection = () => {
    if (!bodyRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;
    
    const range = selection.getRangeAt(0);
    // Check if selection is within the body editor
    if (!bodyRef.current.contains(range.commonAncestorContainer)) return;
    
    // Get selected text
    const text = selection.toString().trim();
    if (text.length > 0) {
      setSelectedText(text);
      // Save selection range to restore later
      const bodyContent = bodyRef.current.innerHTML;
      const startOffset = bodyContent.indexOf(text);
      if (startOffset >= 0) {
        setSelectionRange({
          start: startOffset,
          end: startOffset + text.length
        });
      }
    }
  };

  // Handle enhancement request
  const handleEnhance = async () => {
    if (!body.trim()) {
      addToast({
        variant: "danger",
        message: "Cannot enhance empty content"
      });
      return;
    }

    setIsEnhancing(true);

    try {
      const textToEnhance = selectedText || body;
      const res = await fetch('/api/inbox/enhance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: textToEnhance,
          action: enhancementType,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Enhancement request failed');
      }
      
      const data = await res.json();
      if (data.success && data.enhancedContent) {
        setEnhancedContent(data.enhancedContent);
        setShowEnhancementOptions(false);
      } else {
        throw new Error(data.error || 'Failed to enhance content');
      }
    } catch (error) {
      console.error("Error enhancing content:", error);
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsEnhancing(false);
    }
  };

  // Apply enhanced content
  const applyEnhancement = () => {
    if (!enhancedContent || !bodyRef.current) return;
    
    if (selectedText && selectionRange) {
      // Replace just the selected portion
      const currentContent = bodyRef.current.innerHTML;
      const beforeSelection = currentContent.substring(0, selectionRange.start);
      const afterSelection = currentContent.substring(selectionRange.end);
      
      bodyRef.current.innerHTML = beforeSelection + enhancedContent + afterSelection;
    } else {
      // Replace entire body
      bodyRef.current.innerHTML = enhancedContent;
    }
    
    // Update state and clear enhancement data
    setBody(bodyRef.current.innerHTML);
    setEnhancedContent("");
    setSelectedText("");
    setSelectionRange(null);
    
    addToast({
      variant: "success",
      message: "Changes applied successfully"
    });
  };

  // Dismiss enhancement
  const dismissEnhancement = () => {
    setEnhancedContent("");
    setSelectedText("");
    setSelectionRange(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to.trim()) {
      addToast({
        variant: "danger",
        message: "Please enter at least one recipient"
      });
      return;
    }

    if (!subject.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send without a subject?"
      });
      // Continue anyway
    }

    if (!body.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send an empty message?"
      });
      // Continue anyway
    }

    setIsSending(true);

    try {
      await sendEmail.mutateAsync({
        to,
        cc: cc || undefined,
        bcc: bcc || undefined,
        subject,
        body,
        threadId,
      });

      addToast({
        variant: "success",
        message: "Your email has been sent successfully"
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "An unexpected error occurred"
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card
      padding="0"
      fitWidth
      fitHeight
      background="surface"
      border="neutral-alpha-medium"
      radius="l"
      shadow="xl"
      style={{ position: "fixed", bottom: "24px", right: "24px", width: "600px", maxHeight: "80vh", zIndex: 100 }}
    >
      <form onSubmit={handleSubmit} style={{ height: "100%" }}>
        <Column fill>
          <Row
            horizontal="space-between"
            vertical="center"
            paddingY="12"
            paddingX="24"
            background="neutral-alpha-weak"
            borderBottom="neutral-alpha-medium"
          >
            <Text variant="heading-strong-s">New Email</Text>
            <IconButton
              tooltip="Close"
              tooltipPosition="left"
              variant="ghost"
              icon="close"
              onClick={onClose}
            />
          </Row>

          <Column fillWidth padding="20" gap="16" overflow="auto">
            <Input 
              id="to"
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              placeholder="recipient@example.com"
              hasPrefix={<Icon name="person" size="s" />}
            />

            {showCcBcc && (
              <>
                <Input 
                  id="cc"
                  label="Cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                  hasPrefix={<Icon name="person" size="s" />}
                />
                <Input 
                  id="bcc"
                  label="Bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                  hasPrefix={<Icon name="person" size="s" />}
                />
              </>
            )}

            {!showCcBcc && (
              <Row horizontal="end">
                <Button
                  variant="tertiary"
                  label="Add Cc/Bcc"
                  size="s"
                  prefixIcon="plus"
                  onClick={() => setShowCcBcc(true)}
                />
              </Row>
            )}

            <Input 
              id="subject"
              label="Subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Subject"
              hasPrefix={<Icon name="tag" size="s" />}
            />

            <Column fillWidth fitHeight>
              <Row horizontal="space-between" vertical="center" marginBottom="8">
                <Text variant="label-strong-s">Message</Text>
                
                {enhancedContent ? (
                  <Card padding="8" background="success-alpha-weak" border="success-alpha-medium" radius="m">
                    <Row gap="8" vertical="center">
                      <Icon name="checkCircle" color="success" size="s" />
                      <Text variant="label-strong-s" color="success">Changes ready</Text>
                      <Button
                        variant="primary"
                        size="s"
                        label="Apply"
                        onClick={applyEnhancement}
                      />
                      <IconButton
                        variant="ghost"
                        icon="close"
                        tooltip="Dismiss"
                        onClick={dismissEnhancement}
                      />
                    </Row>
                  </Card>
                ) : showEnhancementOptions ? (
                  <Row gap="8">
                    <DropdownWrapper
                      trigger={
                        <Button
                          variant="secondary"
                          size="s"
                          label={enhancementType === "improve" ? "Improve" : 
                                 enhancementType === "shorten" ? "Shorten" :
                                 enhancementType === "formal" ? "Make Formal" : "Make Friendly"}
                          suffixIcon="chevronDown"
                        />
                      }
                      dropdown={
                        <Card padding="0" shadow="xl" radius="m">
                          <Column padding="8" gap="4">
                            <Button
                              variant={enhancementType === "improve" ? "primary" : "tertiary"}
                              size="s"
                              label="Improve writing"
                              prefixIcon="sparkles"
                              onClick={() => setEnhancementType("improve")}
                              fillWidth
                              justifyContent="start"
                            />
                            <Button
                              variant={enhancementType === "shorten" ? "primary" : "tertiary"}
                              size="s"
                              label="Make concise"
                              prefixIcon="scissors"
                              onClick={() => setEnhancementType("shorten")}
                              fillWidth
                              justifyContent="start"
                            />
                            <Button
                              variant={enhancementType === "formal" ? "primary" : "tertiary"}
                              size="s"
                              label="Make formal"
                              prefixIcon="briefcase"
                              onClick={() => setEnhancementType("formal")}
                              fillWidth
                              justifyContent="start"
                            />
                            <Button
                              variant={enhancementType === "friendly" ? "primary" : "tertiary"}
                              size="s"
                              label="Make friendly"
                              prefixIcon="smile"
                              onClick={() => setEnhancementType("friendly")}
                              fillWidth
                              justifyContent="start"
                            />
                          </Column>
                        </Card>
                      }
                    />
                    
                    <Button
                      variant="primary"
                      size="s"
                      label="Enhance"
                      prefixIcon="sparkles"
                      loading={isEnhancing}
                      disabled={isEnhancing}
                      onClick={handleEnhance}
                    />
                    
                    <IconButton
                      variant="ghost"
                      icon="close"
                      tooltip="Cancel"
                      onClick={() => {
                        setShowEnhancementOptions(false);
                        setSelectedText("");
                      }}
                    />
                  </Row>
                ) : (
                  <Button
                    variant="tertiary"
                    size="s"
                    label="Enhance writing"
                    prefixIcon="sparkles"
                    onClick={() => setShowEnhancementOptions(true)}
                  />
                )}
              </Row>
              
              <Card
                padding="0"
                radius="m"
                border="neutral-alpha-medium"
                style={{ minHeight: "200px" }}
              >
                <div
                  ref={bodyRef}
                  onInput={handleBodyChange}
                  onMouseUp={handleTextSelection}
                  onKeyUp={handleTextSelection}
                  style={{
                    minHeight: "200px",
                    padding: "16px",
                    outline: "none",
                    overflowY: "auto",
                    backgroundColor: "var(--color-bg-default)",
                    borderRadius: "var(--radius-m)",
                  }}
                />
              </Card>
              
              {selectedText && (
                <Row gap="4" marginTop="8" vertical="center">
                  <Icon name="search" size="xs" color="neutral" />
                  <Text variant="label-default-xs" color="neutral">
                    {selectedText.length} characters selected
                  </Text>
                </Row>
              )}
              
              {enhancedContent && (
                <Card 
                  fillWidth 
                  marginTop="16" 
                  border="neutral-alpha-medium" 
                  background="neutral-alpha-weak" 
                  radius="m" 
                  padding="16"
                >
                  <Row gap="8" vertical="center" marginBottom="8">
                    <Icon name="sparkles" color="brand" size="s" />
                    <Text variant="label-strong-s" color="brand">Enhanced version</Text>
                  </Row>
                  <Card
                    background="surface"
                    border="neutral-alpha-medium"
                    radius="m"
                    padding="16"
                    style={{
                      maxHeight: "150px",
                      overflowY: "auto"
                    }}
                  >
                    {enhancedContent}
                  </Card>
                </Card>
              )}
            </Column>
          </Column>

          <Row
            gap="8"
            horizontal="end"
            borderTop="neutral-alpha-medium"
            paddingY="12"
            paddingX="20"
            background="neutral-alpha-weak"
          >
            <Button 
              variant="tertiary" 
              label="Cancel" 
              onClick={onClose} 
              disabled={isSending} 
            />
            <Button 
              type="submit" 
              label="Send" 
              prefixIcon="send" 
              loading={isSending}
              disabled={isSending || !to.trim()} 
              variant="primary"
            />
          </Row>
        </Column>
      </form>
    </Card>
  );
} 