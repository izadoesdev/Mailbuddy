import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { google } from "googleapis";
import env from "@/libs/env";

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
  console.log(`[Email Read API] ${message}`, ...args);
};

// Gmail user ID for API
const GMAIL_USER_ID = 'me';

/**
 * PUT handler for marking an email as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
    log(`Marking email ${id} as read for user ${userId}`);
    
    // First check if the email exists and belongs to the user
    const email = await prisma.email.findFirst({
      where: {
        id,
        userId
      }
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
          isRead: true
        }
      });
    }
    
    // Sync with Gmail - Remove UNREAD label
    if (accessToken) {
      try {
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        const gmail = google.gmail({ version: "v1", auth: oauth2Client });
        
        // Remove 'UNREAD' label from the message
        await gmail.users.messages.modify({
          userId: GMAIL_USER_ID,
          id,
          requestBody: {
            removeLabelIds: ['UNREAD']
          }
        });
        
        log(`Successfully removed UNREAD label in Gmail for message ${id}`);
      } catch (gmailError) {
        log(`Error updating Gmail labels: ${gmailError}`);
        // Continue with database update even if Gmail sync fails
      }
    } else {
      log(`No access token available for Gmail sync`);
    }
    
    // Update the isRead status in database
    const updatedEmail = await prisma.email.update({
      where: {
        id
      },
      data: {
        isRead: true
      }
    });
    
    log(`Successfully marked email ${id} as read`);
    
    return NextResponse.json({
      success: true,
      email: {
        id: updatedEmail.id,
        isRead: updatedEmail.isRead
      }
    });
    
  } catch (error) {
    log('Error marking email as read:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
} 