import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { Prisma } from "@prisma/client";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { shouldExcludeFromContacts } from "../utils/constants";

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
    const page = Number.parseInt(searchParams.get("page") || "1", 10);
    const pageSize = Number.parseInt(searchParams.get("pageSize") || "20", 10);
    const sortBy = searchParams.get("sortBy") || "emailCount";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const category = searchParams.get("category");
    const priority = searchParams.get("priority");
    const searchQuery = searchParams.get("query");
    const includeAutomated = searchParams.get("includeAutomated") === "true";

    try {
        // Calculate pagination
        const skip = (page - 1) * pageSize;

        // Get total count of unique contacts for pagination
        const totalCountResult = await prisma.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(DISTINCT e."from") as count 
            FROM "emails" e
            ${category || priority ? Prisma.sql`LEFT JOIN "email_ai_metadata" m ON e."id" = m."emailId"` : Prisma.empty}
            WHERE e."userId" = ${userId}
            ${searchQuery ? Prisma.sql`AND e."from" ILIKE ${`%${searchQuery}%`}` : Prisma.empty}
            ${category ? Prisma.sql`AND m."category" = ${category}` : Prisma.empty}
            ${priority ? Prisma.sql`AND m."priority" = ${priority}` : Prisma.empty}
        `;

        const totalCount = Number(totalCountResult[0]?.count || 0);

        // If no contacts found, return early
        if (totalCount === 0) {
            return NextResponse.json({
                contacts: [],
                totalCount: 0,
                page,
                pageSize,
                hasMore: false,
            });
        }

        // Create sort order for SQL query
        let orderBySql: Prisma.Sql;
        if (sortBy === "emailCount") {
            orderBySql =
                sortOrder === "asc" ? Prisma.sql`email_count ASC` : Prisma.sql`email_count DESC`;
        } else if (sortBy === "latestEmailDate") {
            orderBySql =
                sortOrder === "asc" ? Prisma.sql`latest_date ASC` : Prisma.sql`latest_date DESC`;
        } else if (sortBy === "name") {
            // Name sorting will happen in JS after decryption
            orderBySql = Prisma.sql`email_count DESC`; // Default sorting
        } else {
            orderBySql = Prisma.sql`email_count DESC`; // Default sorting
        }

        // Main query using raw SQL for efficient aggregation
        const contactsRaw = await prisma.$queryRaw<any[]>`
            SELECT 
                e."from",
                COUNT(*) as email_count,
                COUNT(DISTINCT e."threadId") as thread_count,
                MAX(e."internalDate") as latest_date,
                SUM(CASE WHEN e."isRead" = false THEN 1 ELSE 0 END) as unread_count,
                BOOL_OR(e."isStarred") as is_starred
            FROM "emails" e
            ${category || priority ? Prisma.sql`LEFT JOIN "email_ai_metadata" m ON e."id" = m."emailId"` : Prisma.empty}
            WHERE e."userId" = ${userId}
            ${searchQuery ? Prisma.sql`AND e."from" ILIKE ${`%${searchQuery}%`}` : Prisma.empty}
            ${category ? Prisma.sql`AND m."category" = ${category}` : Prisma.empty}
            ${priority ? Prisma.sql`AND m."priority" = ${priority}` : Prisma.empty}
            GROUP BY e."from"
            ORDER BY ${orderBySql}
            LIMIT ${pageSize * 2} 
            OFFSET ${skip}
        `;

        // Process the raw results to match the Contact interface
        const contactPromises = contactsRaw.map(async (rawContact) => {
            const { name, email } = decryptFrom(rawContact.from);

            // Skip automated senders unless explicitly included
            if (!includeAutomated && shouldExcludeFromContacts(email)) {
                return null;
            }

            // Get categories and priorities for this contact in a separate query
            const metadataCounts = await prisma.$queryRaw<any[]>`
                SELECT 
                    m."category",
                    COUNT(*) as category_count,
                    m."priority",
                    COUNT(*) as priority_count
                FROM "emails" e
                JOIN "email_ai_metadata" m ON e."id" = m."emailId"
                WHERE e."userId" = ${userId}
                AND e."from" = ${rawContact.from}
                GROUP BY m."category", m."priority"
            `;

            // Process metadata counts
            const categories: { [key: string]: number } = {};
            const priorities: { [key: string]: number } = {};

            for (const row of metadataCounts) {
                if (row.category) {
                    categories[row.category] = Number(row.category_count);
                }
                if (row.priority) {
                    priorities[row.priority] = Number(row.priority_count);
                }
            }

            // Build the contact object
            return {
                email,
                name: name || email,
                emailCount: Number(rawContact.email_count),
                latestEmailDate: rawContact.latest_date
                    ? new Date(Number(rawContact.latest_date))
                    : new Date(0),
                threadCount: Number(rawContact.thread_count),
                categories,
                priorities,
                isStarred: rawContact.is_starred,
                unreadCount: Number(rawContact.unread_count),
            };
        });

        // Process all contacts and filter out null values (automated senders)
        let contacts = (await Promise.all(contactPromises)).filter(
            (contact) => contact !== null,
        ) as Contact[];

        // We fetch more items than needed to account for filtered automated senders
        // Now trim to the actual page size
        contacts = contacts.slice(0, pageSize);

        // Sort by name if requested (after decryption)
        if (sortBy === "name") {
            contacts.sort((a, b) => {
                return sortOrder === "asc"
                    ? a.name.localeCompare(b.name)
                    : b.name.localeCompare(a.name);
            });
        } else if (sortBy === "priority") {
            // Sort by contact with highest priority emails
            contacts.sort((a, b) => {
                const priorityOrder = { Urgent: 4, High: 3, Medium: 2, Low: 1 };

                // Calculate weighted priority score
                const getScore = (contact: Contact) => {
                    let score = 0;
                    let total = 0;

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

                return sortOrder === "asc" ? scoreA - scoreB : scoreB - scoreA;
            });
        }

        // Recalculate hasMore since we've filtered out some contacts
        const actualTotalCount = totalCount - (contactsRaw.length - contacts.length);
        const hasMore = skip + contacts.length < actualTotalCount;

        // Return the response
        return NextResponse.json({
            contacts,
            totalCount: actualTotalCount,
            page,
            pageSize,
            hasMore,
        });
    } catch (error) {
        console.error("Error fetching contacts:", error);
        return NextResponse.json(
            { error: "Error fetching contacts", details: String(error) },
            { status: 500 },
        );
    }
}
