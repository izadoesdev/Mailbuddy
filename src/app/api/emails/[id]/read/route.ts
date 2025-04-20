import { withGmailApi } from "@/app/api/utils/withGmail";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Email Read API] ${message}`, ...args);
};

// Gmail user ID for API
const GMAIL_USER_ID = "me";

/**
 * PUT handler for marking an email as read
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    // Get email ID from params
    const { id } = await params;

    if (!id) {
        return NextResponse.json({ error: "Email ID is required" }, { status: 400 });
    }

    // Authenticate user
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: {
            id: true,
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
    const accessToken = user.accounts[0].accessToken;
    const refreshToken = user.accounts[0].refreshToken;

    try {
        log(`Marking email ${id} as read for user ${userId}`);

        // First check if the email exists and belongs to the user
        const email = await prisma.email.findFirst({
            where: {
                id,
                userId,
            },
            select: {
                labels: true,
                isRead: true,
                id: true,
            },
        });

        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        // Skip if the email is already marked as read
        if (email.isRead) {
            log(`Email ${id} is already marked as read`);
            return NextResponse.json({
                success: true,
                email: {
                    id: email.id,
                    isRead: true,
                },
            });
        }

        // Sync with Gmail - Remove UNREAD label using withGmailApi helper
        const gmailResult = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            // Remove 'UNREAD' label from the message
            const response = await gmail.users.messages.modify({
                userId: GMAIL_USER_ID,
                id,
                requestBody: {
                    removeLabelIds: ["UNREAD"],
                },
            });

            log(`Successfully removed UNREAD label in Gmail for message ${id}`);

            return response.data;
        });

        if (!gmailResult) {
            log("Gmail API operation failed, but continuing with database update");
        }

        // Update the isRead status in database
        const updatedEmail = await prisma.email.update({
            where: {
                id,
            },
            data: {
                isRead: true,
                labels: {
                    set: email.labels.filter((label) => label !== "UNREAD"),
                },
            },
        });

        log(`Successfully marked email ${id} as read`);

        return NextResponse.json({
            success: true,
            email: {
                id: updatedEmail.id,
                isRead: updatedEmail.isRead,
            },
        });
    } catch (error) {
        log("Error marking email as read:", error);

        // Handle specific auth errors
        if (error instanceof Error && error.message === "AUTH_REFRESH_FAILED") {
            return NextResponse.json(
                { error: "Authentication failed. Please sign in again." },
                { status: 401 },
            );
        }

        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
}
