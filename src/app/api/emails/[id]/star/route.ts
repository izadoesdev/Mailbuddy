import { withGmailApi } from "@/app/api/utils/withGmail";
import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { headers } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Email Star API] ${message}`, ...args);
};

// Gmail user ID for API
const GMAIL_USER_ID = "me";

/**
 * PUT handler for starring/unstarring an email
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
        // Get request body to determine star status
        const body = await request.json();
        const isStarred = !!body.isStarred;

        log(`${isStarred ? "Starring" : "Unstarring"} email ${id} for user ${userId}`);

        // First check if the email exists and belongs to the user
        const email = await prisma.email.findFirst({
            where: {
                id,
                userId,
            },
        });

        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        // Skip if the star status is already what we want
        if (email.isStarred === isStarred) {
            log(`Email ${id} already has isStarred=${isStarred}`);
            return NextResponse.json({
                success: true,
                email: {
                    id: email.id,
                    isStarred: email.isStarred,
                },
            });
        }

        // Sync with Gmail - Add or remove STARRED label using withGmailApi helper
        const gmailResult = await withGmailApi(userId, accessToken, refreshToken, async (gmail) => {
            // Add or remove 'STARRED' label based on isStarred value
            const response = await gmail.users.messages.modify({
                userId: GMAIL_USER_ID,
                id,
                requestBody: {
                    addLabelIds: isStarred ? ["STARRED"] : [],
                    removeLabelIds: isStarred ? [] : ["STARRED"],
                },
            });

            log(
                `Successfully ${isStarred ? "added" : "removed"} STARRED label in Gmail for message ${id}`,
            );

            return response.data;
        });

        if (!gmailResult) {
            log("Gmail API operation failed, but continuing with database update");
        }

        // Update the star status in the database
        const updatedEmail = await prisma.email.update({
            where: {
                id,
            },
            data: {
                isStarred,
            },
        });

        log(`Successfully ${isStarred ? "starred" : "unstarred"} email ${id}`);

        return NextResponse.json({
            success: true,
            email: {
                id: updatedEmail.id,
                isStarred: updatedEmail.isStarred,
            },
        });
    } catch (error) {
        log("Error updating star status:", error);

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
