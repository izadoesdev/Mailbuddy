import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { encodeEncryptedData, encryptText } from "@/libs/utils/encryption";
import type { gmail_v1 } from "googleapis";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";
import { withGmailApi } from "../../utils/withGmail";

/**
 * POST handler for sending emails via Gmail API
 */
export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
            email: true,
            accounts: {
                where: {
                    providerId: "google",
                },
            },
        },
    });

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const userId = user.id;
    const accessToken = user.accounts[0].accessToken ?? null;
    const refreshToken = user.accounts[0].refreshToken ?? null;

    try {
        // Parse request body
        const { to, cc, bcc, subject, body, threadId } = await request.json();

        // Validate required fields
        if (!to || !subject || !body) {
            return NextResponse.json(
                { error: "Missing required fields: to, subject, and body are required" },
                { status: 400 },
            );
        }

        // Create email MIME message
        const message = createEmailMimeMessage(to, cc, bcc, subject, body, threadId);

        // Send the email using Gmail API
        const result = await withGmailApi(
            userId,
            accessToken,
            refreshToken,
            async (gmail: gmail_v1.Gmail) => {
                const response = await gmail.users.messages.send({
                    userId: "me",
                    requestBody: {
                        raw: message,
                        threadId,
                    },
                });

                return response.data;
            },
        );

        if (!result) {
            return NextResponse.json({ error: "Failed to send email" }, { status: 500 });
        }

        // Store sent email in database
        const messageId = result.id || "";
        const resultThreadId = result.threadId || threadId || "";

        // Create Message record
        await createMessageRecord(messageId, resultThreadId, userId);

        // Create Email record with encryption
        const emailData = {
            id: messageId,
            threadId: resultThreadId,
            userId,
            subject,
            from: session.user.email || "",
            to,
            snippet: body.substring(0, 100).replace(/<[^>]*>/g, ""), // Simple HTML snippet extraction
            body,
            isRead: true, // Sent emails are always read
            isStarred: false,
            labels: ["SENT"],
            internalDate: new Date().getTime().toString(),
        };

        await createEmailRecord(emailData);

        return NextResponse.json({
            success: true,
            messageId: result.id,
            threadId: result.threadId,
        });
    } catch (error) {
        console.error("Error sending email:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}

/**
 * Create a Message record in the database
 */
async function createMessageRecord(id: string, threadId: string, userId: string): Promise<void> {
    await prisma.message.create({
        data: {
            id,
            threadId,
            userId,
        },
    });
}

/**
 * Create an Email record in the database with encryption
 */
async function createEmailRecord(emailData: any): Promise<void> {
    // Encrypt body
    const {
        encryptedData: encryptedBodyData,
        iv: bodyIv,
        authTag: bodyAuthTag,
    } = encryptText(emailData.body);
    const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);

    // Encrypt subject
    const {
        encryptedData: encryptedSubjectData,
        iv: subjectIv,
        authTag: subjectAuthTag,
    } = encryptText(emailData.subject);
    const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);

    // Encrypt snippet
    const {
        encryptedData: encryptedSnippetData,
        iv: snippetIv,
        authTag: snippetAuthTag,
    } = encryptText(emailData.snippet || "");
    const encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);

    // Create the encrypted email record
    await prisma.email.create({
        data: {
            ...emailData,
            body: encryptedBody,
            subject: encryptedSubject,
            snippet: encryptedSnippet,
        },
    });
}

/**
 * Create a base64 encoded MIME message for sending via Gmail API
 */
function createEmailMimeMessage(
    to: string,
    cc?: string,
    bcc?: string,
    subject?: string,
    body?: string,
    threadId?: string,
): string {
    // Build email headers
    let emailContent = "";
    emailContent += `To: ${to}\r\n`;

    if (cc) {
        emailContent += `Cc: ${cc}\r\n`;
    }

    if (bcc) {
        emailContent += `Bcc: ${bcc}\r\n`;
    }

    emailContent += `Subject: ${subject || ""}\r\n`;
    emailContent += "Content-Type: text/html; charset=utf-8\r\n";
    emailContent += "MIME-Version: 1.0\r\n\r\n";

    // Add email body
    emailContent += body || "";

    // Encode to base64url format
    return Buffer.from(emailContent)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}
