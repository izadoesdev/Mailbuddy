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
const FETCH_BATCH_SIZE = 5; // Number of emails to fetch from Gmail at once

// Helper function to log messages
const log = (message: string, ...args: any[]) => {
  console.log(`[Inbox API] ${message}`, ...args);
};

/**
 * GET handler for inbox API
 */
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
    
    log(`Fetching inbox for user: ${userId}, page: ${page}, pageSize: ${pageSize}, threadView: ${threadView}`);
    
    // Get total thread count
    const totalCount = await getTotalThreadCount(userId);
    log(`Total thread count: ${totalCount}`);
    
    // Get message IDs 
    const messageIds = await getMessageIds(userId, threadView, pageSize, skip);
    log(`Retrieved ${messageIds.length} message IDs`);
    
    // Get existing emails from database
    const existingEmails = await getExistingEmails(messageIds);
    log(`Found ${existingEmails.length} existing emails in database`);
    
    // Find missing emails
    const existingEmailIds = new Set(existingEmails.map(e => e.id));
    const missingMessageIds = messageIds
      .map(m => m.id)
      .filter(id => !existingEmailIds.has(id));
    log(`Need to fetch ${missingMessageIds.length} emails from Gmail API`);
    
    // Fetch missing emails from Gmail
    const fetchedEmails = await fetchMissingEmails(
      missingMessageIds, 
      userId, 
      session.user.accessToken ?? null
    );
    log(`Successfully fetched ${fetchedEmails.length} emails from Gmail API`);
    
    // Process emails
    const allEmails = processEmails(
      existingEmails, 
      fetchedEmails, 
      threadView
    );
    log(`Total emails to display: ${allEmails.length}`);
    
    // Return the results
    return NextResponse.json({
      emails: allEmails,
      hasMore: totalCount > (skip + pageSize),
      totalCount,
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

/**
 * Count total threads for a user
 */
async function getTotalThreadCount(userId: string): Promise<number> {
  const result = await prisma.message.groupBy({
    by: ['threadId'],
    where: { userId },
    _count: true
  });
  
  return result.length;
}

/**
 * Get message IDs based on view type and pagination
 */
async function getMessageIds(
  userId: string, 
  threadView: boolean, 
  pageSize: number, 
  skip: number
): Promise<{ id: string }[]> {
  if (threadView) {
    log(`Thread view: fetching threads with skip=${skip}, take=${pageSize}`);
    
    try {
      // First try to get thread data from the emails table which is faster
      // and includes more details like internalDate for better sorting
      const threadsFromEmails = await prisma.email.findMany({
        where: { userId },
        select: { 
          id: true,
          threadId: true,
          internalDate: true,
          createdAt: true,
        },
        distinct: ['threadId'],
        orderBy: [
          // First try to sort by internalDate (Gmail's timestamp) if available
          { internalDate: 'desc' },
          // Otherwise fall back to our database timestamp
          { createdAt: 'asc' }
        ],
        take: 1000 // Reasonable limit to avoid processing too many threads
      });
      
      log(`Found ${threadsFromEmails.length} threads from emails table`);
      
      if (threadsFromEmails.length > 0) {
        // Sort the threads by date (newest first)
        const sortedEmails = threadsFromEmails.sort((a, b) => {
          const dateA = a.internalDate ? parseInt(a.internalDate) : a.createdAt.getTime();
          const dateB = b.internalDate ? parseInt(b.internalDate) : b.createdAt.getTime();
          return dateB - dateA;
        });
        
        // Apply pagination after sorting
        const paginatedEmails = sortedEmails.slice(skip, skip + pageSize);
        log(`After pagination: returning ${paginatedEmails.length} thread emails`);
        
        // Return email IDs for the paginated threads
        return paginatedEmails.map(email => ({ id: email.id }));
      }
      
      // Fallback: If no emails are found, try messages table
      log(`No emails found in emails table, falling back to messages table`);
      
      // Get all thread IDs for this user with a reasonable limit
      const allThreads = await prisma.message.findMany({
        where: { userId },
        select: { 
          id: true,
          threadId: true, 
          createdAt: true 
        },
        orderBy: { createdAt: 'asc' },
        take: 1000 // Limit to prevent performance issues
      });
      
      log(`Fallback: Found ${allThreads.length} thread messages from messages table`);
      
      if (allThreads.length === 0) {
        return [];
      }
      
      // Group messages by threadId and find the latest in each thread
      const latestMessagesByThread = Object.values(
        allThreads.reduce((threads, message) => {
          if (!threads[message.threadId] || 
              message.createdAt > threads[message.threadId].createdAt) {
            threads[message.threadId] = message;
          }
          return threads;
        }, {} as Record<string, typeof allThreads[0]>)
      );
      
      // Sort by creation date (newest first)
      latestMessagesByThread.sort((a, b) => 
        b.createdAt.getTime() - a.createdAt.getTime()
      );
      
      // Apply pagination
      const paginatedMessages = latestMessagesByThread.slice(skip, skip + pageSize);
      log(`After filtering and pagination: ${paginatedMessages.length} thread messages`);
      
      // Return just the IDs
      return paginatedMessages.map(msg => ({ id: msg.id }));
    } catch (error) {
      log('Error fetching thread messages:', error);
      return [];
    }
  } else {
    log(`Message view: fetching messages directly with skip=${skip}, take=${pageSize}`);
    
    try {
      // For non-thread view, get all message IDs with pagination
      const messages = await prisma.message.findMany({
        where: { userId },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
        skip,
        take: pageSize,
      });
      
      log(`Found ${messages.length} messages`);
      return messages;
    } catch (error) {
      log('Error fetching direct messages:', error);
      return [];
    }
  }
}

/**
 * Get existing emails from database
 */
async function getExistingEmails(messageIds: { id: string }[]): Promise<any[]> {
  if (messageIds.length === 0) {
    return [];
  }
  
  const ids = messageIds.map(m => m.id);
  log(`Looking for emails with IDs: ${ids.join(', ')}`);
  
  const emails = await prisma.email.findMany({
    where: {
      id: {
        in: ids
      }
    }
  });
  
  log(`Found ${emails.length} emails in database before decryption`);
  
  // Decrypt emails
  return emails.map(email => decryptEmail(email));
}

/**
 * Fetch missing emails from Gmail
 */
async function fetchMissingEmails(
  missingIds: string[], 
  userId: string, 
  accessToken: string | null
): Promise<any[]> {
  if (missingIds.length === 0 || !accessToken) {
    return [];
  }
  
  // Set up Gmail API client once
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });
  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  
  // Fetch messages in batches to avoid overwhelming Gmail API
  const fetchedEmails = [];
  
  for (let i = 0; i < missingIds.length; i += FETCH_BATCH_SIZE) {
    const batch = missingIds.slice(i, i + FETCH_BATCH_SIZE);
    
    // Fetch messages in parallel
    const messageBatchPromises = batch.map(async (messageId) => {
      try {
        // Get the message details from database first
        const message = await prisma.message.findUnique({
          where: { id: messageId },
          select: { id: true, threadId: true, createdAt: true }
        });
        
        if (!message) return null;
        
        // Fetch from Gmail API
        const fullMessage = await gmail.users.messages.get({
          userId: GMAIL_USER_ID,
          id: messageId,
          format: 'full'
        });
        
        if (!fullMessage.data) return null;
        
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
          id: messageId,
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
        
        return emailData;
      } catch (error) {
        log(`Error fetching email for message ${messageId}:`, error);
        return null;
      }
    });
    
    // Wait for all fetches to complete
    const fetchedBatch = await Promise.all(messageBatchPromises);
    const validEmails = fetchedBatch.filter(email => email !== null) as any[];
    
    // Batch store the emails in database
    if (validEmails.length > 0) {
      // Encrypt and store each email
      const storePromises = validEmails.map(emailData => encryptAndStoreEmail(emailData));
      await Promise.all(storePromises);
      
      // Add to results
      fetchedEmails.push(...validEmails);
    }
  }
  
  return fetchedEmails;
}

/**
 * Process and sort emails
 */
function processEmails(
  existingEmails: any[], 
  fetchedEmails: any[], 
  threadView: boolean
): any[] {
  // Combine existing and fetched emails
  const allEmails = [...existingEmails, ...fetchedEmails];
  
  // Sort emails by date
  allEmails.sort((a, b) => {
    // Use internalDate if available, otherwise fall back to createdAt
    const dateA = a.internalDate ? new Date(parseInt(a.internalDate)) : new Date(a.createdAt);
    const dateB = b.internalDate ? new Date(parseInt(b.internalDate)) : new Date(b.createdAt);
    return dateB.getTime() - dateA.getTime();
  });
  
  // Process for thread view 
  if (!threadView) {
    return allEmails;
  }
  
  // Only keep the most recent email for each thread
  return Object.values(
    allEmails.reduce((threads, email) => {
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
  );
}

/**
 * Cancel an ongoing inbox fetch
 */
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

