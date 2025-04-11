import type { Email as PrismaEmail, EmailAIMetadata } from "@prisma/client";

export interface Email extends PrismaEmail {
    aiMetadata: EmailAIMetadata | null;
}

export interface InboxResponse {
    emails: Email[];
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
