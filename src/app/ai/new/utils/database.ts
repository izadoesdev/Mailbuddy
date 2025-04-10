'use server'

import { prisma } from '@/libs/db';

/**
 * Save email AI metadata to the database
 */
export async function saveEmailAIMetadata({
  emailId,
  category,
  priority,
  priorityExplanation,
  summary,
  sentiment,
  importance,
  requiresResponse,
  responseTimeframe,
  keywords,
  processingTime,
  modelUsed,
  tokensUsed,
  categories = [],
  categoryConfidences = {}
}: {
  emailId: string;
  category?: string;
  categories?: string[];
  categoryConfidences?: any;
  priority?: string;
  priorityExplanation?: string;
  summary?: string;
  sentiment?: string;
  importance?: string;
  requiresResponse?: boolean;
  responseTimeframe?: string;
  keywords?: string[];
  processingTime?: number;
  modelUsed?: string;
  tokensUsed?: number;
}) {
  try {
    // Use upsert to handle both insert and update cases
    const result = await prisma.emailAIMetadata.upsert({
      where: {
        emailId: emailId
      },
      update: {
        category,
        categories,
        categoryConfidences,
        priority,
        priorityExplanation,
        summary,
        sentiment,
        importance,
        requiresResponse,
        responseTimeframe,
        keywords: keywords || [],
        processingTime,
        modelUsed,
        tokensUsed
      },
      create: {
        emailId,
        category,
        categories,
        categoryConfidences,
        priority,
        priorityExplanation,
        summary,
        sentiment,
        importance,
        requiresResponse,
        responseTimeframe,
        keywords: keywords || [],
        processingTime,
        modelUsed,
        tokensUsed
      }
    });
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error saving email AI metadata:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get email AI metadata from the database
 */
export async function getEmailAIMetadata(emailId: string) {
  try {
    const metadata = await prisma.emailAIMetadata.findUnique({
      where: {
        emailId: emailId
      }
    });
    
    return { success: true, metadata };
  } catch (error) {
    console.error('Error getting email AI metadata:', error);
    return { success: false, error: String(error) };
  }
}

/**
 * Get multiple email AI metadata records from the database
 */
export async function getMultipleEmailAIMetadata(emailIds: string[]) {
  try {
    const metadata = await prisma.emailAIMetadata.findMany({
      where: {
        emailId: {
          in: emailIds
        }
      }
    });
    
    return { success: true, metadata };
  } catch (error) {
    console.error('Error getting multiple email AI metadata:', error);
    return { success: false, error: String(error), metadata: [] };
  }
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(category: string, limit = 10) {
  try {
    const metadata = await prisma.emailAIMetadata.findMany({
      where: {
        category
      },
      include: {
        email: true
      },
      take: limit
    });
    
    return { success: true, emails: metadata.map(m => m.email) };
  } catch (error) {
    console.error('Error getting emails by category:', error);
    return { success: false, error: String(error), emails: [] };
  }
}

/**
 * Get emails by priority
 */
export async function getEmailsByPriority(priority: string, limit = 10) {
  try {
    const metadata = await prisma.emailAIMetadata.findMany({
      where: {
        priority
      },
      include: {
        email: true
      },
      take: limit
    });
    
    return { success: true, emails: metadata.map(m => m.email) };
  } catch (error) {
    console.error('Error getting emails by priority:', error);
    return { success: false, error: String(error), emails: [] };
  }
} 