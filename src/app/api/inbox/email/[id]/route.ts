import { prisma } from "@/libs/db";
import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { decryptEmails } from "@/libs/services";
import { headers } from "next/headers";

export async function GET(
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the email ID from the URL
    const { id: emailId } = await params;
    
    if (!emailId) {
      return NextResponse.json(
        { error: "Email ID is required" },
        { status: 400 }
      );
    }

    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }


    // Fetch email with AI metadata
    const email = await prisma.email.findUnique({
      where: {
        id: emailId,
        userId: session.user.id, // Ensure user owns this email
      },
      include: {
        aiMetadata: true,
      },
    });

    if (!email) {
      return NextResponse.json(
        { error: "Email not found" },
        { status: 404 }
      );
    }

    // Decrypt the email and return the first (and only) item in the array
    const decryptedEmails = decryptEmails([email]);
    const decryptedEmail = decryptedEmails[0];

    return NextResponse.json(decryptedEmail);
  } catch (error) {
    console.error("Error fetching email:", error);
    return NextResponse.json(
      { error: "Failed to fetch email" },
      { status: 500 }
    );
  }
} 