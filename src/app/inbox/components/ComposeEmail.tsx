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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!to.trim()) {
      addToast({
        variant: "danger",
        message: "Please enter at least one recipient",
      });
      return;
    }

    if (!subject.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send without a subject?",
      });
      // Continue anyway
    }

    if (!body.trim()) {
      addToast({
        variant: "danger",
        message: "Are you sure you want to send an empty message?",
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
        message: "Your email has been sent successfully",
      });

      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
    } catch (error) {
      console.error("Error sending email:", error);
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "An unexpected error occurred",
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
              <Text variant="label-default-s" marginBottom="4">Message</Text>
              <div
                ref={bodyRef}
                onInput={handleBodyChange}
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