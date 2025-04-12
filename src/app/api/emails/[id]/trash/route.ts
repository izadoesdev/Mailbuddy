import { type NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { google } from "googleapis";
import env from "@/libs/env";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
    console.log(`[Email Trash API] ${message}`, ...args);
};

// Gmail user ID for API
const GMAIL_USER_ID = "me";

/**
 * PUT handler for moving an email to trash
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

    const userId = session.user.id;
    const accessToken = session.user.accessToken;

    try {
        log(`Moving email ${id} to trash for user ${userId}`);

        // First check if the email exists and belongs to the user
        const email = await prisma.email.findFirst({
            where: {
                id,
                userId,
            },
            select: {
                labels: true,
                id: true,
                threadId: true
            },
        });

        if (!email) {
            return NextResponse.json({ error: "Email not found" }, { status: 404 });
        }

        // Check if the email is already in trash
        if (email.labels.includes("TRASH")) {
            log(`Email ${id} is already in trash`);
            return NextResponse.json({
                success: true,
                email: {
                    id: email.id,
                    isTrash: true,
                },
            });
        }

        // Sync with Gmail - Move to TRASH
        if (accessToken) {
            try {
                const oauth2Client = new google.auth.OAuth2();
                oauth2Client.setCredentials({ access_token: accessToken });
                const gmail = google.gmail({ version: "v1", auth: oauth2Client });

                // Add TRASH label to the message
                await gmail.users.messages.modify({
                    userId: GMAIL_USER_ID,
                    id,
                    requestBody: {
                        addLabelIds: ["TRASH"],
                    },
                });

                log(`Successfully added TRASH label in Gmail for message ${id}`);
            } catch (gmailError) {
                log(`Error updating Gmail labels: ${gmailError}`);
                // Continue with database update even if Gmail sync fails
            }
        } else {
            log("No access token available for Gmail sync");
        }

        // Update the labels in database to add TRASH and remove inbox-related labels
        const inboxLabels = ["INBOX", "UNREAD", "IMPORTANT", "CATEGORY_PERSONAL", "CATEGORY_SOCIAL", 
                            "CATEGORY_PROMOTIONS", "CATEGORY_UPDATES", "CATEGORY_FORUMS"];
        
        const updatedEmail = await prisma.email.update({
            where: {
                id,
            },
            data: {
                labels: {
                    set: [...email.labels.filter(label => !inboxLabels.includes(label)), "TRASH"],
                },
            },
        });

        log(`Successfully moved email ${id} to trash`);

        return NextResponse.json({
            success: true,
            email: {
                id: updatedEmail.id,
                isTrash: true,
            },
        });
    } catch (error) {
        log("Error moving email to trash:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "An unexpected error occurred",
            },
            { status: 500 },
        );
    }
} 