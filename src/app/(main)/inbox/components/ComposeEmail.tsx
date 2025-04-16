import { useState, useRef, useEffect } from "react";
import {
  Button,
  Column,
  Input,
  Row,
  Text,
  IconButton,
  useToast,
  Line,
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
      const res = await fetch('/api/inbox/enchance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          emailContent: textToEnhance,
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
    <Row
      padding="0"
      maxWidth={40}
      maxHeight={48}
      overflow="hidden"
      background="neutral-weak"
      border="neutral-alpha-medium"
      radius="m"
      position="fixed"
      bottom="8"
      right="8"
      zIndex={9}
    >
      <form onSubmit={handleSubmit} style={{ height: "100%", width: "100%" }}>
        <Column fill>
          <Row
            horizontal="space-between"
            vertical="center"
            paddingY="8"
            paddingX="16"
            background="neutral-alpha-weak"
            borderBottom="neutral-alpha-medium"
          >
            <Text variant="heading-strong-s">New email</Text>
            <IconButton
              tooltip="Close"
              tooltipPosition="left"
              variant="ghost"
              icon="close"
              onClick={onClose}
            />
          </Row>

          <Input 
              style={{ border: "1px solid transparent" }}
              id="to"
              label="To"
              radius="none"
              value={to}
              labelAsPlaceholder
              hasSuffix={
                !showCcBcc && (
                    <Button
                        data-border="rounded"
                        variant="secondary"
                        prefixIcon="plus"
                        label="Add people"
                        size="s"
                        onClick={() => setShowCcBcc(true)}
                    />
                )
            }
              onChange={(e) => setTo(e.target.value)}
              required
            />

            <Line background="neutral-alpha-medium"/>

            {showCcBcc && (
              <>
                <Input 
                  radius="none"
                  style={{ border: "1px solid transparent" }}
                  id="cc"
                  label="Cc"
                  value={cc}
                  labelAsPlaceholder
                  onChange={(e) => setCc(e.target.value)}
                />
                <Line background="neutral-alpha-medium"/>
                <Input 
                  radius="none"
                  style={{ border: "1px solid transparent" }}
                  id="bcc"
                  label="Bcc"
                  value={bcc}
                  labelAsPlaceholder
                  onChange={(e) => setBcc(e.target.value)}
                />
                <Line background="neutral-alpha-medium"/>
              </>
            )}

            <Input 
              radius="none"
              style={{ border: "1px solid transparent" }}
              id="subject"
              label="Subject"
              value={subject}
              labelAsPlaceholder
              onChange={(e) => setSubject(e.target.value)}
            />

            <Line background="neutral-alpha-medium"/>

          <Column fill overflow="auto">
            <Column fillWidth fitHeight>
              <style>{`
                .compose-editor {
                  font-family: var(--font-sans);
                  font-size: var(--font-size-body-m);
                  line-height: 1.6;
                  min-height: 200px;
                  width: 100%;
                  height: 100%;
                  border-radius: var(--radius-m);
                  padding: var(--static-space-20);
                  background: var(--static-color-neutral-800);
                  color: var(--static-white);
                  outline: none;
                  overflow-y: auto;
                }
                
                .compose-editor:focus {
                  outline: 1px solid var(--static-color-brand-500);
                }
                
                .compose-editor p {
                  margin-top: 0;
                  margin-bottom: 1em;
                }
                
                .compose-editor a {
                  color: var(--static-color-brand-300);
                  text-decoration: underline;
                }
                
                .compose-editor a:hover {
                  color: var(--static-color-brand-200);
                }
                
                .compose-editor h1, 
                .compose-editor h2, 
                .compose-editor h3, 
                .compose-editor h4, 
                .compose-editor h5, 
                .compose-editor h6 {
                  margin-top: 1.5em;
                  margin-bottom: 0.5em;
                  font-weight: 600;
                  line-height: 1.25;
                  color: var(--static-white);
                }
                
                .compose-editor h1 { font-size: 1.5rem; }
                .compose-editor h2 { font-size: 1.3rem; }
                .compose-editor h3 { font-size: 1.2rem; }
                .compose-editor h4 { font-size: 1.1rem; }
                .compose-editor h5, 
                .compose-editor h6 { font-size: 1rem; }
                
                .compose-editor ul, 
                .compose-editor ol {
                  margin-top: 0;
                  margin-bottom: 1em;
                  padding-left: 2em;
                }
                
                .compose-editor li {
                  margin-bottom: 0.5em;
                }
                
                .compose-editor li::marker {
                  color: var(--static-white);
                }
                
                .compose-editor blockquote {
                  margin: 1em 0;
                  padding-left: 1em;
                  border-left: 3px solid var(--static-color-neutral-600);
                  color: var(--static-color-neutral-300);
                }
                
                .compose-editor code {
                  font-family: var(--static-font-family-mono);
                  font-size: 0.9em;
                  background: var(--static-color-neutral-900);
                  color: var(--static-color-neutral-200);
                  padding: 0.2em 0.4em;
                  border-radius: 3px;
                }
                
                .compose-editor pre {
                  font-family: var(--static-font-family-mono);
                  font-size: 0.9em;
                  line-height: 1.4;
                  background: var(--static-color-neutral-900);
                  color: var(--static-color-neutral-200);
                  padding: 1em;
                  border-radius: 6px;
                  overflow-x: auto;
                  margin: 1em 0;
                }
                
                .compose-editor img {
                  max-width: 100%;
                  height: auto;
                  border-radius: 6px;
                }
                
                .compose-editor hr {
                  margin: 2em 0;
                  border: 0;
                  border-top: 1px solid var(--static-color-neutral-600);
                }
                
                .compose-editor table {
                  border-collapse: collapse;
                  width: 100%;
                  margin: 1em 0;
                }
                
                .compose-editor th, 
                .compose-editor td {
                  border: 1px solid var(--static-color-neutral-600);
                  padding: 0.5em;
                  text-align: left;
                }
                
                .compose-editor th {
                  background: var(--static-color-neutral-700);
                  font-weight: 600;
                }

                /* Enhanced content styles in dark mode */
                .enhanced-content {
                  color: var(--static-white) !important;
                  background: var(--static-color-neutral-800) !important;
                  font-family: var(--font-sans);
                  font-size: var(--font-size-body-m);
                  line-height: 1.6;
                  border-radius: var(--radius-m);
                  padding: var(--static-space-12);
                }
              `}</style>
              <div
                ref={bodyRef}
                onInput={handleBodyChange}
                onMouseUp={handleTextSelection}
                className="compose-editor"
              />

              {/* Display Enhanced Content */}
              {enhancedContent && (
                <Column gap="8" paddingX="12" paddingY="8" borderTop="neutral-alpha-medium">
                  <Row horizontal="space-between" vertical="center">
                    <Text variant="body-strong-s">Enhanced version {selectedText ? "(selected text)" : ""}</Text>
                    <Row gap="8">
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
                  </Row>
                  <Column 
                    padding="12" 
                    radius="m" 
                    background="neutral-strong"
                    border="neutral-alpha-medium"
                  >
                    <div 
                      dangerouslySetInnerHTML={{ __html: enhancedContent }} 
                      className="enhanced-content"
                    />
                  </Column>
                </Column>
              )}
            </Column>
          </Column>

          <Row
            gap="8"
            horizontal="space-between"
            vertical="center"
            borderTop="neutral-alpha-medium"
            paddingY="12"
            paddingX="20"
            data-border="rounded"
            background="neutral-alpha-weak"
          >
            {/* Enhancement Options */}
            {!enhancedContent && (
              <Row gap="4" wrap>
                {showEnhancementOptions ? (
                  <>
                    <Button 
                      variant="secondary" 
                      weight="default"
                      size="s" 
                      label="Improve" 
                      type="button"
                      onClick={() => {
                        setEnhancementType("improve");
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      weight="default"
                      size="s" 
                      label="Shorten" 
                      type="button"
                      onClick={() => {
                        setEnhancementType("shorten");
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      weight="default"
                      size="s" 
                      label="Formal" 
                      type="button"
                      onClick={() => {
                        setEnhancementType("formal");
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      weight="default"
                      size="s" 
                      label="Friendly" 
                      type="button"
                      onClick={() => {
                        setEnhancementType("friendly");
                      }}
                    />
                    <Button 
                      variant="secondary" 
                      weight="default"
                      size="s" 
                      label="Enhance" 
                      type="button"
                      onClick={handleEnhance}
                      loading={isEnhancing}
                    />
                    <Button 
                      variant="tertiary" 
                      weight="default"
                      size="s" 
                      prefixIcon="close" 
                      type="button"
                      onClick={() => setShowEnhancementOptions(false)}
                    />
                  </>
                ) : (
                  <Button 
                    variant="secondary" 
                    size="s" 
                    prefixIcon="sparkles" 
                    weight="default"
                    label="Enhance with AI"
                    type="button"
                    onClick={() => setShowEnhancementOptions(true)} 
                  />
                )}
              </Row>
            )}
            <Row maxWidth={6}>
              <Button
                fillWidth
                suffixIcon={isSending ? "" : "send"}
                data-border="rounded"
                type="submit" 
                label={isSending ? "" : "Send"}
                loading={isSending}
                disabled={isSending || !to.trim()} 
              />
            </Row>
          </Row>
        </Column>
      </form>
    </Row>
  );
} 