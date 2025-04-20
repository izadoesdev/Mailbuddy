import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { decodeEncryptedData, decryptText } from "@/libs/utils";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

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
 * Decrypt email content
 */
function decryptEmails(email: any): any {
    const decryptedEmail = { ...email };

    if (email.subject) {
        decryptedEmail.subject = decryptField(email.subject);
    }

    if (email.body) {
        decryptedEmail.body = decryptField(email.body);
    }

    if (email.snippet) {
        decryptedEmail.snippet = decryptField(email.snippet);
    }

    if (email.from) {
        // Extract both name and email parts from the from field if it contains angle brackets
        // Format: "Some Name" <email@example.com> or Name <email@example.com> or just email@example.com
        const emailRegex = /(.*?)\s*<([^>]+)>/;
        const matches = email.from.match(emailRegex);

        if (matches) {
            // If we have both name and email parts
            let fromName = matches[1].trim();
            const fromEmail = matches[2];

            // If name is in quotes, remove them
            if (fromName.startsWith('"') && fromName.endsWith('"')) {
                fromName = fromName.substring(1, fromName.length - 1);
            }

            // Add new properties for name and email parts
            decryptedEmail.fromName = fromName;
            decryptedEmail.fromEmail = fromEmail;

            // Keep the original from value
            decryptedEmail.from = email.from;
        } else {
            // If there's no match, it's likely just an email address
            decryptedEmail.fromName = "";
            decryptedEmail.fromEmail = email.from;
            decryptedEmail.from = email.from;
        }
    }

    // Make sure isRead flag is consistent with UNREAD label
    if (email.labels?.includes("UNREAD") ?? false) {
        decryptedEmail.isRead = false;
    }

    return decryptedEmail;
}

export async function GET(req: NextRequest) {
    try {
        const id = new URL(req.url).pathname.split("/").pop();
        if (!id) {
            return NextResponse.json({ error: "Email ID is required" }, { status: 400 });
        }

        // Check authentication
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Fetch email with AI metadata
        const email = await prisma.email.findUnique({
            where: {
                id: id,
                userId: session.user.id, // Ensure user owns this email
            },
            include: {
                aiMetadata: true,
            },
        });

        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        // Decrypt the email and return the first (and only) item in the array
        const decryptedEmails = decryptEmails([email]);
        const decryptedEmail = decryptedEmails[0];

        return NextResponse.json(decryptedEmail);
    } catch (error) {
        console.error("Error fetching email:", error);
        return NextResponse.json({ error: "Failed to fetch email" }, { status: 500 });
    }
}
