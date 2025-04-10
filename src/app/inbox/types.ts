import type { Email as PrismaEmail, EmailAIMetadata } from "@prisma/client";

export interface Email extends PrismaEmail {
    aiMetadata: EmailAIMetadata;
}

export interface InboxResponse {
    emails: Email[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
}
