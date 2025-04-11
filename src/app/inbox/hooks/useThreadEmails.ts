import { useQuery } from "@tanstack/react-query";
import type { Email } from "../types";

interface ThreadEmailsResponse {
  emails: Email[];
  threadMessageCount: number;
}

interface UseThreadEmailsParams {
  threadId: string | null;
  enabled?: boolean;
}

const fetchThreadEmails = async (threadId: string): Promise<ThreadEmailsResponse> => {
  try {
    const response = await fetch(`/api/emails/thread?threadId=${threadId}`);
    
    if (!response.ok) {
      console.warn(`API returned status ${response.status} when fetching thread emails`);
      return {
        emails: [],
        threadMessageCount: 0
      };
    }
    
    const data = await response.json();
    
    // Process emails to ensure dates are correctly formatted
    data.emails = data.emails.map((email: Email) => ({
      ...email,
      createdAt: email.internalDate
        ? new Date(Number.parseInt(email.internalDate))
        : new Date(email.createdAt),
    }));
    
    return data;
  } catch (error) {
    console.error("Error fetching thread emails:", error);
    return {
      emails: [],
      threadMessageCount: 0
    };
  }
};

export function useThreadEmails({ threadId, enabled = true }: UseThreadEmailsParams) {
  const queryEnabled = enabled && !!threadId;
  
  const { data, isLoading } = useQuery({
    queryKey: ["threadEmails", threadId],
    queryFn: () => threadId ? fetchThreadEmails(threadId) : Promise.resolve({ emails: [], threadMessageCount: 0 }),
    enabled: queryEnabled,
  });
  
  return {
    emails: data?.emails || [],
    threadMessageCount: data?.threadMessageCount || 0,
    isLoading
  };
} 