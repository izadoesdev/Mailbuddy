import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { decodeEncryptedData, decryptText } from "@/libs/utils/encryption";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Email API] ${message}`, ...args);
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
 * GET handler for retrieving a specific email by ID
 */
export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
        return NextResponse.json({ error: "Email ID is required" }, { status: 400 });
    }

    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    try {
        log(`Fetching email ${id} for user ${userId}`);

        // Get the email from database
        const email = await prisma.email.findFirst({
            where: {
                id,
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
            },
        });

        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        // Decrypt the email content
        const decryptedEmail = decryptEmail(email);

        // Mark as read if not already
        if (!email.isRead) {
            // Only update the database, don't wait for the operation
            prisma.email
                .update({
                    where: { id },
                    data: { isRead: true },
                })
                .catch((err) => {
                    log(`Error marking email ${id} as read:`, err);
                });
        }

        // Ensure the date is properly formatted
        const formattedEmail = {
            ...decryptedEmail,
            // Convert internalDate (if available) or use createdAt
            createdAt: decryptedEmail.internalDate
                ? new Date(Number(decryptedEmail.internalDate))
                : new Date(decryptedEmail.createdAt),
        };

        return NextResponse.json(formattedEmail);
    } catch (error) {
        log("Error retrieving email:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}
