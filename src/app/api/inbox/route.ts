import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/libs/db";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { encryptText, encodeEncryptedData, decodeEncryptedData, decryptText } from "@/libs/utils/encryption";
import { google } from "googleapis";
import { extractContentFromParts } from "@/libs/utils/email-content";
import env from "@/libs/env";

// For API requests
const GMAIL_USER_ID = 'me';
const PAGE_SIZE = 5; // Default number of emails per page

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
  console.log(`[Inbox API] ${message}`, ...args);
};

export async function GET(request: NextRequest) {
  // Get request parameters
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || PAGE_SIZE.toString(), 10);
  const threadView = searchParams.get("threadView") === "true";
  
  // Authenticate user
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  const userId = session.user.id;
  
  try {
    // Calculate offset based on page
    const skip = (page - 1) * pageSize;
    
    // Fetch thread IDs from the database
    const threads = await prisma.message.groupBy({
      by: ['threadId', 'createdAt'],
      where: {
        userId
      },
      orderBy: {
          createdAt: 'asc'
      },
      skip,
      take: pageSize,
      _count: true
    });
    
    const totalThreads = await prisma.message.groupBy({
      by: ['threadId'],
      where: {
        userId
      },
      _count: true
    });
    
    const totalCount = totalThreads.length;
    const hasMore = totalCount > (skip + pageSize);
    
    // Get threads for the current page
    const emails = [];
    
    // Fetch emails for each thread
    for (const thread of threads) {
      const threadId = thread.threadId;
      
      // Get messages in this thread
      const messages = await prisma.message.findMany({
        where: {
          threadId,
          userId
        },
        orderBy: {
          createdAt: 'desc'
        }
      });
      
      // Get emails for these messages
      for (const message of messages) {
        // Check if email already exists
        const existingEmail = await prisma.email.findUnique({
          where: {
            id: message.id
          }
        });
        
        if (existingEmail) {
          // Decrypt and add to results
          const decryptedEmail = decryptEmail(existingEmail);
          emails.push(decryptedEmail);
        } else if (session.user.accessToken) {
          // Fetch from Gmail if we have access token
          try {
            // Set up Gmail API client
            const oauth2Client = new google.auth.OAuth2();
            oauth2Client.setCredentials({ access_token: session.user.accessToken });
            const gmail = google.gmail({ version: "v1", auth: oauth2Client });
            
            // Fetch email from Gmail
            const fullMessage = await gmail.users.messages.get({
              userId: GMAIL_USER_ID,
              id: message.id,
              format: 'full'
            });
            
            if (fullMessage.data) {
              // Extract email details
              const headers = fullMessage.data.payload?.headers || [];
              const subject = headers.find((h: any) => h.name === 'Subject')?.value || '';
              const from = headers.find((h: any) => h.name === 'From')?.value || '';
              const to = headers.find((h: any) => h.name === 'To')?.value || '';
              
              // Get email content
              const content = fullMessage.data.payload 
                ? extractContentFromParts(fullMessage.data.payload) 
                : { text: '', html: '' };
              
              // Create email object
              const emailData = {
                id: message.id,
                threadId: message.threadId,
                userId,
                subject,
                from,
                to,
                snippet: fullMessage.data.snippet || null,
                body: content.html || content.text || fullMessage.data.snippet || 'No content available',
                isRead: fullMessage.data.labelIds?.includes('UNREAD') ? false : true,
                isStarred: fullMessage.data.labelIds?.includes('STARRED') || false,
                labels: fullMessage.data.labelIds || [],
                internalDate: fullMessage.data.internalDate || null,
                createdAt: message.createdAt
              };
              
              // Store email in database
              await encryptAndStoreEmail(emailData)
              
              // Add to results
              emails.push(emailData);
            }
          } catch (error) {
            log(`Error fetching email for message ${message.id}:`, error);
            
            // Check if this is an auth error
            if (
              error instanceof Error && 
              (error.message.includes('invalid_grant') || 
               error.message.includes('Invalid Credentials') ||
               error.message.includes('token has been expired or revoked'))
            ) {
              // Try to refresh token
              const newToken = await refreshAccessToken(userId);
              if (!newToken) {
                return NextResponse.json({ error: "Authentication failed. Please sign in again." }, { status: 401 });
              }
            }
          }
        }
      }
    }
    
    // Sort emails by date
    emails.sort((a, b) => {
      // Use internalDate if available, otherwise fall back to createdAt
      const dateA = a.internalDate ? new Date(parseInt(a.internalDate)) : new Date(a.createdAt);
      const dateB = b.internalDate ? new Date(parseInt(b.internalDate)) : new Date(b.createdAt);
      return dateB.getTime() - dateA.getTime();
    });
    
    // If in thread view, only keep the most recent email for each thread
    const processedEmails = threadView 
      ? Object.values(
          emails.reduce((threads, email) => {
            const emailDate = email.internalDate 
              ? new Date(parseInt(email.internalDate)) 
              : new Date(email.createdAt);
            
            if (!threads[email.threadId] || 
                emailDate > (threads[email.threadId].internalDate 
                  ? new Date(parseInt(threads[email.threadId].internalDate)) 
                  : new Date(threads[email.threadId].createdAt))) {
              threads[email.threadId] = email;
            }
            return threads;
          }, {} as Record<string, any>)
        )
      : emails;
    
    // Return the results
    return NextResponse.json({
      emails: processedEmails,
      hasMore,
      totalCount,
      totalThreads: threads.length,
      page,
      pageSize
    });
    
  } catch (error) {
    log('Error in inbox retrieval:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }, { status: 500 });
  }
}

// Cancel an ongoing inbox fetch
export async function DELETE(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  
  return NextResponse.json({ success: true, message: "No active fetch to cancel" });
}

/**
 * Encrypts and stores an email in the database
 */
async function encryptAndStoreEmail(emailData: any) {
  // Encrypt body
  const { encryptedData: encryptedBodyData, iv: bodyIv, authTag: bodyAuthTag } = encryptText(emailData.body);
  const encryptedBody = encodeEncryptedData(encryptedBodyData, bodyIv, bodyAuthTag);
  
  // Encrypt subject
  const { encryptedData: encryptedSubjectData, iv: subjectIv, authTag: subjectAuthTag } = encryptText(emailData.subject);
  const encryptedSubject = encodeEncryptedData(encryptedSubjectData, subjectIv, subjectAuthTag);
  
  // Encrypt snippet if it exists
  let encryptedSnippet = null;
  if (emailData.snippet) {
    const { encryptedData: encryptedSnippetData, iv: snippetIv, authTag: snippetAuthTag } = encryptText(emailData.snippet);
    encryptedSnippet = encodeEncryptedData(encryptedSnippetData, snippetIv, snippetAuthTag);
  }
  
  // Store the encrypted email, preserving all other fields including internalDate
  const encryptedEmail = {
    ...emailData,
    body: encryptedBody,
    subject: encryptedSubject,
    snippet: encryptedSnippet
  };
  
  // Store in database
  await prisma.email.create({
    data: encryptedEmail
  });
  
  return encryptedEmail;
}

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
      decryptedEmail.body = '[Content decryption failed]';
    }
  }
  
  // Decrypt subject if it exists
  if (email.subject) {
    try {
      const { encryptedData, iv, authTag } = decodeEncryptedData(email.subject);
      decryptedEmail.subject = decryptText(encryptedData, iv, authTag);
    } catch (error) {
      log(`Error decrypting email subject ${email.id}:`, error);
      decryptedEmail.subject = '[Subject decryption failed]';
    }
  }
  
  // Decrypt snippet if it exists
  if (email.snippet) {
    try {
      const { encryptedData, iv, authTag } = decodeEncryptedData(email.snippet);
      decryptedEmail.snippet = decryptText(encryptedData, iv, authTag);
    } catch (error) {
      log(`Error decrypting email snippet ${email.id}:`, error);
      decryptedEmail.snippet = '[Snippet decryption failed]';
    }
  }
  
  return decryptedEmail;
}

/**
 * Refresh access token for a user
 */
async function refreshAccessToken(userId: string): Promise<string | null> {
  try {
    // Find the user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { accounts: true }
    });
    
    if (!user || !user.accounts || user.accounts.length === 0) {
      log(`No accounts found for user ${userId}`);
      return null;
    }
    
    // Get the Google account
    const googleAccount = user.accounts.find(account => account.providerId === 'google');
    if (!googleAccount || !googleAccount.refreshToken) {
      log(`No Google account or refresh token found for user ${userId}`);
      return null;
    }
    
    // Set up OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    );
    
    // Set refresh token
    oauth2Client.setCredentials({
      refresh_token: googleAccount.refreshToken
    });
    
    // Refresh the token
    const { credentials } = await oauth2Client.refreshAccessToken();
    const newAccessToken = credentials.access_token;
    
    if (!newAccessToken) {
      log(`Failed to refresh access token for user ${userId}`);
      return null;
    }
    
    // Update the access token in the database
    await prisma.account.update({
      where: { id: googleAccount.id },
      data: {
        accessToken: newAccessToken,
      }
    });
    
    log(`Successfully refreshed access token for user ${userId}`);
    return newAccessToken;
  } catch (error) {
    log(`Error refreshing access token for user ${userId}:`, error);
    return null;
  }
}

