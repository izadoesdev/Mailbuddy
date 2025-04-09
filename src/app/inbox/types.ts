export interface Email {
    id: string;
    threadId: string;
    subject: string;
    from: string;
    to?: string;
    snippet: string;
    body?: string;
    isRead: boolean;
    isStarred?: boolean;
    labels: string[];
    createdAt: Date;
    internalDate?: string;
}

export interface InboxResponse {
    emails: Email[];
    totalCount: number;
    hasMore: boolean;
    page: number;
    pageSize: number;
}
