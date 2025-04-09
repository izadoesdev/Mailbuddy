export interface Email {
    id: string;
    subject: string;
    from: string;
    to: string;
    body: string;
    read: boolean;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
}

export interface EmailResponse {
    messages?: any[];
    newEmailsCount?: number;
    error?: string;
    stats?: {
        totalEmails: number;
        existingEmails: number;
        newEmails: number;
        fetchTime: number;
        currentPage?: number;
        totalPages?: number;
    };
    isComplete?: boolean;
}
