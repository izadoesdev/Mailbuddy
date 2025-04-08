import { PrismaClient } from '@prisma/client';
import { EmailData } from './gmail';
import { encryptText, encodeEncryptedData, decodeEncryptedData, decryptText } from '../utils/encryption';

// Initialize Prisma client
const prisma = new PrismaClient();

/**
 * Interface for email response
 */
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

/**
 * Fetches existing emails from the database
 * @param userId User ID
 * @param limit Maximum number of emails to fetch
 * @param skip Number of emails to skip (for pagination)
 * @returns Array of emails
 */
export async function getExistingEmails(userId: string, limit: number = 20, skip: number = 0): Promise<any[]> {
    return prisma.email.findMany({
        where: {
            userId
        },
        orderBy: {
            createdAt: 'desc'
        },
        take: limit,
        skip: skip
    });
}

/**
 * Decrypts email fields
 * @param emails Array of emails
 * @returns Array of emails with decrypted fields
 */
export function decryptEmails(emails: any[]): any[] {
    return emails.map(email => {
        const decryptedEmail = { ...email };
        
        // Decrypt body if it exists
        if (email.body) {
            try {
                const { encryptedData, iv, authTag } = decodeEncryptedData(email.body);
                decryptedEmail.body = decryptText(encryptedData, iv, authTag);
            } catch (error) {
                console.error(`[Email DB] Error decrypting email body ${email.id}:`, error);
                decryptedEmail.body = '[Content decryption failed]';
            }
        }
        
        // Decrypt subject if it exists
        if (email.subject) {
            try {
                const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
                decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
            } catch (error) {
                console.error(`[Email DB] Error decrypting email subject ${email.id}:`, error);
                decryptedEmail.subject = '[Subject decryption failed]';
            }
        }
        
        // Decrypt snippet if it exists
        if (email.snippet) {
            try {
                const { encryptedData, iv, authTag } = decodeEncryptedData(email.snippet);
                decryptedEmail.snippet = decryptText(encryptedData, iv, authTag);
            } catch (error) {
                console.error(`[Email DB] Error decrypting email snippet ${email.id}:`, error);
                decryptedEmail.snippet = '[Snippet decryption failed]';
            }
        }
        
        return decryptedEmail;
    });
}

/**
 * Encrypts and stores emails in the database
 * @param emails Array of emails to store
 * @returns Number of emails stored
 */
export async function storeEmails(emails: EmailData[]): Promise<number> {
    if (emails.length === 0) {
        return 0;
    }
    
    // Encrypt email fields
    const encryptedEmails = emails.map(email => {
        // Encrypt body
        const { encryptedData: encryptedBodyData, iv: bodyIv, authTag: bodyAuthTag } = encryptText(email.body);
        const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);
        
        // Encrypt subject
        const { encryptedData: encryptedSubjectData, iv: subjectIv, authTag: subjectAuthTag } = encryptText(email.subject);
        const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);
        
        // Encrypt snippet if it exists
        let encryptedSnippet = null;
        if (email.snippet) {
            const { encryptedData: encryptedSnippetData, iv: snippetIv, authTag: snippetAuthTag } = encryptText(email.snippet);
            encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);
        }
        
        // Preserve all other fields, including internalDate
        return {
            ...email,
            body: encryptedBody,
            subject: encryptedSubject,
            snippet: encryptedSnippet
        };
    });
    
    // Store emails in database
    await prisma.email.createMany({
        data: encryptedEmails,
        skipDuplicates: true
    });
    
    return encryptedEmails.length;
}

/**
 * Checks if emails exist in the database
 * @param userId User ID
 * @param emailIds Array of email IDs
 * @returns Set of existing email IDs
 */
export async function getExistingEmailIds(userId: string, emailIds: string[]): Promise<Set<string>> {
    const existingEmails = await prisma.email.findMany({
        where: {
            userId,
            id: {
                in: emailIds
            }
        },
        select: {
            id: true
        }
    });
    
    return new Set(existingEmails.map(email => email.id));
} 