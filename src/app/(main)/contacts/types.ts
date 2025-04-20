export interface Contact {
    email: string;
    name: string;
    emailCount: number;
    latestEmailDate: Date | string;
    threadCount: number;
    categories: { [key: string]: number };
    priorities: { [key: string]: number };
    isStarred: boolean;
    unreadCount: number;
}

export interface ContactsResponse {
    contacts: Contact[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

export interface ContactsQueryParams {
    page?: number;
    pageSize?: number;
    sortBy?: "name" | "emailCount" | "latestEmailDate" | "priority";
    sortOrder?: "asc" | "desc";
    category?: string;
    priority?: string;
    query?: string;
}
