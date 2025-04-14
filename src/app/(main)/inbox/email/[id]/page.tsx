"use client";

import { useState, useEffect } from "react";
import { 
  Row, 
  Column, 
  Text, 
  Button, 
  Icon, 
  Spinner
} from "@/once-ui/components";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/libs/auth/client";
import { EmailDetail } from "../../components/EmailDetail";
import { extractName } from "../../utils";
import type { Email, Thread } from "../../types";
import { useEmail } from "../../hooks/useEmail";
import { useThreadEmails } from "../../hooks/useThreadEmails";
import { useEmailMutations } from "../../hooks/useEmailMutations";

export default function EmailDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  const emailId = params?.id as string;
  
  const [thread, setThread] = useState<Thread | null>(null);
  const [error, setError] = useState("");

  // Use TanStack Query to fetch the email
  const { 
    data: email, 
    isLoading, 
    isError, 
    error: emailError 
  } = useEmail(emailId, { enabled: !!emailId && !!user });

  // Use email mutations
  const { toggleStar, trashEmail } = useEmailMutations();

  // Fetch thread data when email is loaded and has a threadId
  const {
    emails: threadEmails,
    threadMessageCount,
    isLoading: isThreadLoading
  } = useThreadEmails({
    threadId: email?.threadId || null,
    enabled: !!email?.threadId
  });

  // Construct thread object from email and threadEmails
  useEffect(() => {
    if (email?.threadId && threadEmails.length > 0) {
      setThread({
        threadId: email.threadId,
        emails: threadEmails,
        subject: email.subject || "",
        from: email.from || "",
        to: email.to || "",
        snippet: email.snippet || "",
        isRead: email.isRead,
        isStarred: email.isStarred,
        labels: email.labels || [],
        internalDate: email.internalDate || "",
        aiMetadata: email.aiMetadata,
        emailCount: threadEmails.length
      });
    }
  }, [email, threadEmails]);

  // Set error from email query if it fails
  useEffect(() => {
    if (isError && emailError) {
      setError(emailError instanceof Error ? emailError.message : "Failed to fetch email");
    }
  }, [isError, emailError]);

  const handleGoBack = () => {
    router.back();
  };

  const handleToggleStar = async (item: Email | Thread, e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      e.stopPropagation();
    }
    
    try {
      // Make sure we're working with an Email object
      const id = 'id' in item ? item.id : email?.id;
      if (!id) return;
      
      toggleStar.mutate({
        emailId: id,
        isStarred: !('isStarred' in item ? item.isStarred : false)
      });
    } catch (err) {
      console.error("Error toggling star:", err);
    }
  };

  const handleReply = (email: Email) => {
    router.push(`/compose?reply=${email.id}`);
  };

  const handleForward = (email: Email) => {
    router.push(`/compose?forward=${email.id}`);
  };

  const handleTrash = async (email: Email) => {
    try {
      await trashEmail.mutateAsync(email.id);
      router.push('/inbox');
    } catch (err) {
      console.error("Error moving to trash:", err);
    }
  };

  const handleSelectEmail = (selectedEmail: Email) => {
    // If it's the same email, don't reload
    if (selectedEmail.id === email?.id) return;
    
    // Navigate to the selected email
    router.push(`/inbox/email/${selectedEmail.id}`);
  };

  if (isLoading) {
    return (
      <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
        <Spinner size="m" />
        <Text>Loading email...</Text>
      </Column>
    );
  }

  if (error) {
    return (
      <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
        <Icon name="errorCircle" size="l" color="danger" />
        <Text>{error}</Text>
        <Button variant="primary" onClick={handleGoBack}>Go Back</Button>
      </Column>
    );
  }

  if (!email) {
    return (
      <Column fillWidth horizontal="center" vertical="center" gap="16" padding="64">
        <Icon name="errorCircle" size="l" color="danger" />
        <Text>Email not found</Text>
        <Button variant="primary" onClick={handleGoBack}>Go Back</Button>
      </Column>
    );
  }

  return (
    <Column fillWidth padding="24" gap="16">
      <Row gap="8" vertical="center">
        <Button 
          variant="tertiary" 
          size="s" 
          onClick={handleGoBack}
          prefixIcon="arrowLeft"
        >
          Back
        </Button>
      </Row>
      
      <EmailDetail 
        email={email}
        thread={thread}
        onClose={handleGoBack}
        onToggleStar={handleToggleStar}
        onReply={handleReply}
        onForward={handleForward}
        onTrash={handleTrash}
        onSelectEmail={handleSelectEmail}
      />
    </Column>
  );
} 