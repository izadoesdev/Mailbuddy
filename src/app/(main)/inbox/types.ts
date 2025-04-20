import type { EmailAIMetadata, Email as PrismaEmail } from "@prisma/client";

export interface Email extends PrismaEmail {
    aiMetadata: EmailAIMetadata | null;
    fromName?: string;
    fromEmail?: string;
}

export interface Thread {
    threadId: string;
    emails: Email[];
    subject: string;
    from: string;
    to: string;
    snippet: string;
    isRead: boolean;
    isStarred: boolean;
    labels: string[];
    internalDate: string;
    aiMetadata: EmailAIMetadata | null;
    emailCount: number;
}

export interface InboxResponse {
    threads: Thread[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
}

export type GmailLabel =
    | "INBOX"
    | "SENT"
    | "DRAFT"
    | "TRASH"
    | "SPAM"
    | "STARRED"
    | "IMPORTANT"
    | "CATEGORY_SOCIAL"
    | "CATEGORY_UPDATES"
    | "CATEGORY_FORUMS"
    | "CATEGORY_PROMOTIONS"
    | "CATEGORY_PERSONAL";
