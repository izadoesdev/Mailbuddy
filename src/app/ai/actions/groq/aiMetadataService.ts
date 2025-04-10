'use server'

import { prisma } from "@/libs/db";
import { MODELS } from "./index";

/**
 * Save email AI metadata to the database
 */
export async function saveEmailAIMetadata({
  emailId,
  category,
  priority,
  priorityExplanation,
  summary,
  processingTime,
  modelUsed,
  tokensUsed
}: {
  emailId: string;
  category?: string;
  priority?: string;
  priorityExplanation?: string;
  summary?: string;
  processingTime?: number;
  modelUsed?: string;
  tokensUsed?: number;
}) {
  try {
    // Use upsert to create or update the metadata
    const metadata = await prisma.emailAIMetadata.upsert({
      where: {
        emailId
      },
      update: {
        category,
        priority,
        priorityExplanation,
        summary,
        processingTime,
        modelUsed,
        tokensUsed,
        updatedAt: new Date()
      },
      create: {
        emailId,
        category,
        priority,
        priorityExplanation,
        summary,
        processingTime,
        modelUsed,
        tokensUsed,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    });

    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error("Error saving email AI metadata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get AI metadata for a specific email
 */
export async function getEmailAIMetadata(emailId: string) {
  try {
    const metadata = await prisma.emailAIMetadata.findUnique({
      where: {
        emailId
      }
    });

    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error("Error retrieving email AI metadata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get AI metadata for multiple emails
 */
export async function getMultipleEmailAIMetadata(emailIds: string[]) {
  if (!emailIds.length) return { success: true, metadata: [] };

  try {
    const metadata = await prisma.emailAIMetadata.findMany({
      where: {
        emailId: {
          in: emailIds
        }
      }
    });

    return {
      success: true,
      metadata
    };
  } catch (error) {
    console.error("Error retrieving multiple email AI metadata:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get emails by category
 */
export async function getEmailsByCategory(userId: string, category: string, limit = 10) {
  try {
    const emails = await prisma.email.findMany({
      where: {
        userId,
        aiMetadata: {
          category
        }
      },
      include: {
        aiMetadata: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return {
      success: true,
      emails
    };
  } catch (error) {
    console.error("Error retrieving emails by category:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Get emails by priority
 */
export async function getEmailsByPriority(userId: string, priority: string, limit = 10) {
  try {
    const emails = await prisma.email.findMany({
      where: {
        userId,
        aiMetadata: {
          priority
        }
      },
      include: {
        aiMetadata: true
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });

    return {
      success: true,
      emails
    };
  } catch (error) {
    console.error("Error retrieving emails by priority:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
} 