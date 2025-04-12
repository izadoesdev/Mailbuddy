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
    // Use selected text or full body if nothing selected
    const textToEnhance = selectedText || body;
    if (!textToEnhance.trim()) {
      addToast({
        variant: "danger",
        message: "Please enter some text to enhance"
      });
      return;
    }

    setIsEnhancing(true);
    
    try {
      const response = await fetch('/api/inbox/enchance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          emailContent: `To: ${to}\n${cc ? `Cc: ${cc}\n` : ''}${bcc ? `Bcc: ${bcc}\n` : ''}Subject: ${subject}\n\n${textToEnhance}`,
          action: enhancementType
        })
      });
      
      if (!response.ok) {
        throw new Error('Enhancement request failed');
      }
      
      const data = await response.json();
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
      background="neutral-weak"
      border="neutral-alpha-medium"
      radius="l"
      style={{ position: "fixed", bottom: "24px", right: "24px", width: "600px", maxHeight: "80vh", zIndex: 100 }}
    >
      <form onSubmit={handleSubmit} style={{ height: "100%" }}>
        <Column fill>
          <Row
            horizontal="space-between"
            vertical="center"
            paddingY="12"
            paddingX="24"
            background="neutral-weak"
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

          <Column fillWidth padding="16" gap="12" overflow="auto">
            <Input 
              id="to"
              label="To"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              required
              placeholder="recipient@example.com"
            />

            {showCcBcc && (
              <>
                <Input 
                  id="cc"
                  label="Cc"
                  value={cc}
                  onChange={(e) => setCc(e.target.value)}
                  placeholder="cc@example.com"
                />
                <Input 
                  id="bcc"
                  label="Bcc"
                  value={bcc}
                  onChange={(e) => setBcc(e.target.value)}
                  placeholder="bcc@example.com"
                />
              </>
            )}

            {!showCcBcc && (
              <Row horizontal="end">
                <Button
                  variant="secondary"
                  label="Show Cc/Bcc"
                  size="s"
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
            />

            <Column fillWidth fitHeight>
              <Row horizontal="space-between" vertical="center" marginBottom="4">
                <Text variant="label-default-s">Message</Text>
                
                {enhancedContent ? (
                  <Row gap="8">
                    <Chip 
                      selected
                      label="Changes ready to apply" 
                    />
                    <Button
                      variant="primary"
                      size="s"
                      label="Apply"
                      onClick={applyEnhancement}
                    />
                    <Button
                      variant="secondary"
                      size="s"
                      label="Dismiss"
                      onClick={dismissEnhancement}
                    />
                  </Row>
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
                        />
                      }
                      dropdown={
                        <Column padding="8" gap="4">
                          <Button
                            variant={enhancementType === "improve" ? "primary" : "secondary"}
                            size="s"
                            label="Improve writing"
                            onClick={() => setEnhancementType("improve")}
                          />
                          <Button
                            variant={enhancementType === "shorten" ? "primary" : "secondary"}
                            size="s"
                            label="Make concise"
                            onClick={() => setEnhancementType("shorten")}
                          />
                          <Button
                            variant={enhancementType === "formal" ? "primary" : "secondary"}
                            size="s"
                            label="Make formal"
                            onClick={() => setEnhancementType("formal")}
                          />
                          <Button
                            variant={enhancementType === "friendly" ? "primary" : "secondary"}
                            size="s"
                            label="Make friendly"
                            onClick={() => setEnhancementType("friendly")}
                          />
                        </Column>
                      }
                    />
                    
                    <Button
                      variant="primary"
                      size="s"
                      label="Enhance"
                      loading={isEnhancing}
                      disabled={isEnhancing}
                      onClick={handleEnhance}
                    />
                    
                    <Button
                      variant="secondary"
                      size="s"
                      label="Cancel"
                      onClick={() => {
                        setShowEnhancementOptions(false);
                        setSelectedText("");
                      }}
                    />
                  </Row>
                ) : (
                  <Button
                    variant="secondary"
                    size="s"
                    label="Enhance writing"
                    onClick={() => setShowEnhancementOptions(true)}
                  />
                )}
              </Row>
              
              <div
                ref={bodyRef}
                onInput={handleBodyChange}
                onMouseUp={handleTextSelection}
                onKeyUp={handleTextSelection}
                style={{
                  minHeight: "200px",
                  border: "1px solid var(--color-neutral-alpha-medium)",
                  borderRadius: "var(--radius-m)",
                  padding: "12px",
                  outline: "none",
                  overflowY: "auto",
                  backgroundColor: "var(--color-bg-default)",
                }}
              />
              
              {selectedText && (
                <Text variant="label-default-xs" marginTop="4" color="neutral-medium">
                  Text selected: {selectedText.length} characters
                </Text>
              )}
              
              {enhancedContent && (
                <Column 
                  fillWidth 
                  marginTop="12" 
                  border="neutral-medium" 
                  background="neutral-alpha-weak" 
                  radius="m" 
                  padding="12"
                >
                  <Text variant="label-strong-s" marginBottom="4">Enhanced version:</Text>
                  <div 
                    style={{
                      backgroundColor: "var(--color-bg-default)",
                      padding: "8px",
                      borderRadius: "var(--radius-m)",
                      border: "1px solid var(--color-primary-alpha-weak)",
                      maxHeight: "150px",
                      overflowY: "auto"
                    }}
                  >
                    {enhancedContent}
                  </div>
                </Column>
              )}
            </Column>
          </Column>

          <Row
            gap="8"
            horizontal="end"
            borderTop="neutral-alpha-medium"
            paddingY="8"
            paddingX="16"
          >
            <Button 
              variant="secondary" 
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
            />
          </Row>
        </Column>
      </form>
    </Card>
  );
} 