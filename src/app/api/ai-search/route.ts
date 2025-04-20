import { searchSimilarEmails } from "@/app/(dev)/ai/new/utils/search";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { decodeEncryptedData, decryptText } from "@/libs/utils/encryption";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[AI Search API] ${message}`, ...args);
};

/**
 * Decrypts an email from the database
 */
function decryptEmail(email: any) {
    const decryptedEmail = { ...email };

    // Decrypt body if it exists
    if (email.body) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.body);
            decryptedEmail.body = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email body ${email.id}:`, error);
            decryptedEmail.body = "[Content decryption failed]";
        }
    }

    // Decrypt subject if it exists
    if (email.subject) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
            decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email subject ${email.id}:`, error);
            decryptedEmail.subject = "[Subject decryption failed]";
        }
    }

    // Decrypt snippet if it exists
    if (email.snippet) {
        try {
            const { encryptedData, iv, authTag } = decodeEncryptedData(email.snippet);
            decryptedEmail.snippet = decryptText(encryptedData, iv, authTag);
        } catch (error) {
            log(`Error decrypting email snippet ${email.id}:`, error);
            decryptedEmail.snippet = "[Snippet decryption failed]";
        }
    }

    return decryptedEmail;
}

/**
 * POST handler for AI search
 * This API performs vector search and returns email results in a single request
 */
export async function POST(request: NextRequest) {
    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        // Parse request body
        const body = await request.json();
        const { query, topK = 10 } = body;

        if (!query || typeof query !== "string") {
            return NextResponse.json({ error: "Query is required" }, { status: 400 });
        }

        log(`Processing AI search for user ${userId}: "${query}"`);

        // 1. Perform vector search to get similar email IDs
        const searchResponse = await searchSimilarEmails(query, userId, { topK });

        if (!searchResponse.success) {
            return NextResponse.json(
                { error: searchResponse.error || "Search failed" },
                { status: 500 },
            );
        }

        const results = searchResponse.results;
        log(`Vector search found ${results.length} matching emails`);

        if (results.length === 0) {
            return NextResponse.json({
                success: true,
                emails: [],
                vectorResults: [],
            });
        }

        // 2. Get email IDs from search results
        const emailIds = results.map((result) => result.id);

        // 3. Fetch full email details from database
        const emails = await prisma.email.findMany({
            where: {
                id: { in: emailIds },
                userId,
            },
            select: {
                id: true,
                threadId: true,
                userId: true,
                subject: true,
                from: true,
                to: true,
                snippet: true,
                body: true,
                isRead: true,
                isStarred: true,
                labels: true,
                internalDate: true,
                createdAt: true,
                aiMetadata: true,
            },
        });

        log(`Retrieved ${emails.length} emails from database`);

        // 4. Decrypt and process emails
        const processedEmails = emails.map((email) => {
            const decryptedEmail = decryptEmail(email);
            const matchingResult = results.find((r) => r.id === email.id);

            // Process the email to ensure dates are correctly formatted
            const processedEmail = {
                ...decryptedEmail,
                // Ensure createdAt is a properly formatted date
                createdAt: decryptedEmail.internalDate
                    ? new Date(Number(decryptedEmail.internalDate))
                    : new Date(decryptedEmail.createdAt),
                labels: [...(decryptedEmail.labels || []), "AI_SEARCH"],
                // Add AI score to the email
                aiScore: matchingResult ? matchingResult.score : 0,
            };

            return processedEmail;
        });

        return NextResponse.json({
            success: true,
            emails: processedEmails,
            // Include the original vector results for reference
            vectorResults: results,
        });
    } catch (error) {
        log("Error processing AI search:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}
