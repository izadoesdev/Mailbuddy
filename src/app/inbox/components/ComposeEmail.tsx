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
    <Row
      padding="0"
      maxWidth={40}
      height={48}
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
            paddingY="12"
            paddingX="24"
            background="neutral-weak"
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