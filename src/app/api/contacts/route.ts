import { type NextRequest, NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { prisma } from "@/libs/db";
import {
    decryptText,
    decodeEncryptedData,
} from "@/libs/utils/encryption";

/**
 * Interface for a contact with email metrics
 */
interface Contact {
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

/**
 * Interface for the contacts response
 */
interface ContactsResponse {
    contacts: Contact[];
    totalCount: number;
    page: number;
    pageSize: number;
    hasMore: boolean;
}

/**
 * Decrypts the "from" field to extract name and email
 */
function decryptFrom(encryptedFrom: string): { name: string; email: string } {
    try {
        // Extract name and email from format like "Name <email@example.com>"
        const emailRegex = /(.*?)\s*<([^>]+)>/;
        const matches = encryptedFrom.match(emailRegex);
        
        if (matches) {
            let fromName = matches[1].trim();
            const fromEmail = matches[2];
            
            // If name is in quotes, remove them
            if (fromName.startsWith('"') && fromName.endsWith('"')) {
                fromName = fromName.substring(1, fromName.length - 1);
            }
            
            return { name: fromName, email: fromEmail };
        }
        // If no match, the whole string is an email address
        return { name: "", email: encryptedFrom };
    } catch (error) {
        console.error("Error decrypting from field:", error);
        return { name: "", email: "" };
    }
}

/**
 * Decrypts an encrypted field
 */
function decryptField(encryptedValue: string): string {
    try {
        const { encryptedData, iv, authTag } = decodeEncryptedData(encryptedValue);
        return decryptText(encryptedData, iv, authTag);
    } catch (error) {
        console.error("Decryption failed:", error);
        return "[Decryption failed]";
    }
}

/**
 * Fetch contacts with their email metrics
 */
export async function GET(request: NextRequest) {
    // Authenticate the user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user || !session.user.id) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams;
    const page = Number.parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Number.parseInt(searchParams.get('pageSize') || '20', 10);
    const sortBy = searchParams.get('sortBy') || 'emailCount';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const searchQuery = searchParams.get('query');

    try {
        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // First, get all unique email "from" fields for this user
        const uniqueFroms = await prisma.email.findMany({
            where: {
                userId,
                ...(searchQuery && {
                    from: {
                        contains: searchQuery,
                        mode: 'insensitive',
                    },
                }),
            },
            select: {
                from: true,
            },
            distinct: ['from'],
        });

        // Early return if no emails found
        if (uniqueFroms.length === 0) {
            return NextResponse.json({
                contacts: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false
            });
        }

        // Now we need to count emails per contact
        const contactMap = new Map<string, Contact>();

        // Get all emails for this user
        const emails = await prisma.email.findMany({
            where: {
                userId,
                ...(category && {
                    aiMetadata: {
                        category: { equals: category },
                    },
                }),
                ...(priority && {
                    aiMetadata: {
                        priority: { equals: priority },
                    },
                }),
            },
            include: {
                aiMetadata: true,
            },
            orderBy: {
                internalDate: 'asc',
            },
        });

        // Process all emails to build contact data
        for (const email of emails) {
            // Skip if missing from field
            if (!email.from) continue;

            // Decrypt from field
            const { name, email: fromEmail } = decryptFrom(email.from);
            
            // Skip empty emails
            if (!fromEmail) continue;

            // Get or create a contact entry
            if (!contactMap.has(fromEmail)) {
                contactMap.set(fromEmail, {
                    email: fromEmail,
                    name: name || fromEmail,
                    emailCount: 0,
                    latestEmailDate: new Date(0),
                    threadCount: 0,
                    categories: {},
                    priorities: {},
                    isStarred: false,
                    unreadCount: 0,
                });
            }

            const contact = contactMap.get(fromEmail);
            if (!contact) continue; // Satisfy type checker
            
            contact.emailCount++;

            // Track threads
            const threadIds = new Set<string>();
            if (email.threadId && !threadIds.has(email.threadId)) {
                contact.threadCount++;
                threadIds.add(email.threadId);
            }

            // Track read status
            if (!email.isRead) {
                contact.unreadCount++;
            }

            // Track starred status (if any email from this contact is starred)
            if (email.isStarred) {
                contact.isStarred = true;
            }

            // Track latest email date
            const emailDate = email.internalDate ? new Date(Number(email.internalDate)) : new Date(email.createdAt);
            if (emailDate > new Date(contact.latestEmailDate)) {
                contact.latestEmailDate = emailDate;
            }

            // Track AI metadata categories and priorities
            if (email.aiMetadata) {
                // Add to categories count
                if (email.aiMetadata.category) {
                    contact.categories[email.aiMetadata.category] = 
                        (contact.categories[email.aiMetadata.category] || 0) + 1;
                }

                // Add to priorities count
                if (email.aiMetadata.priority) {
                    contact.priorities[email.aiMetadata.priority] = 
                        (contact.priorities[email.aiMetadata.priority] || 0) + 1;
                }
            }
        }

        // Convert map to array and sort
        const contactsArray = Array.from(contactMap.values());

        // Apply sorting
        if (sortBy === 'name') {
            contactsArray.sort((a, b) => {
                return sortOrder === 'asc'
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        } else if (sortBy === 'emailCount') {
            contactsArray.sort((a, b) => {
                return sortOrder === 'asc'
                    ? a.emailCount - b.emailCount
                    : b.emailCount - a.emailCount;
            });
        } else if (sortBy === 'latestEmailDate') {
            contactsArray.sort((a, b) => {
                const dateA = new Date(a.latestEmailDate).getTime();
                const dateB = new Date(b.latestEmailDate).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            });
        } else if (sortBy === 'priority') {
            // Sort by contact with highest priority emails
            contactsArray.sort((a, b) => {
                const priorityOrder = { "Urgent": 4, "High": 3, "Medium": 2, "Low": 1 };
                
                // Calculate weighted priority score
                const getScore = (contact: Contact) => {
                    let score = 0;
                    let total = 0;
                    
                    // Use for...of instead of forEach
                    for (const [priority, count] of Object.entries(contact.priorities)) {
                        if (priority in priorityOrder) {
                            const prioValue = priorityOrder[priority as keyof typeof priorityOrder];
                            score += prioValue * count;
                            total += count;
                        }
                    }
                    
                    return total > 0 ? score / total : 0;
                };
                
                const scoreA = getScore(a);
                const scoreB = getScore(b);
                
                return sortOrder === 'asc' ? scoreA - scoreB : scoreB - scoreA;
            });
        }

        // Apply pagination
        const totalCount = contactsArray.length;
        const paginatedContacts = contactsArray.slice(skip, skip + pageSize);
        const hasMore = (skip + pageSize) < totalCount;

        // Return the response
        return NextResponse.json({
            contacts: paginatedContacts,
            totalCount,
            page,
            pageSize,
            hasMore
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { error: "Error fetching contacts", details: String(error) },
            { status: 500 }
        );
    }
} 