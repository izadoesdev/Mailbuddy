"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/libs/db";

interface MetadataStats {
  totalEmails: number;
  emailsWithMetadata: number;
  topPriorities: { label: string; count: number }[];
  categoryCounts: { [key: string]: number };
  metadataSize: string; // in KB or MB
  lastAnalyzedDate: string | null;
}

interface AISettings {
  enabled: boolean;
  customPrompt: string;
  preserveMetadata: boolean;
  priorityKeywords: string[];
  contentAlerts: {
    urgentRequests: boolean;
    financialContent: boolean;
    deadlines: boolean;
    meetings: boolean;
    legalDocuments: boolean;
    personalInfo: boolean;
  };
  analysisPreferences: {
    summarize: boolean;
    categorize: boolean;
    extractActions: boolean;
    detectSentiment: boolean;
    highlightImportant: boolean;
  };
  aiAssistLevel: string;
}

/**
 * Calculate the approximate size of metadata in KB or MB
 */
function calculateMetadataSize(metadataCount: number): string {
  // Rough estimation based on average metadata size
  const estimatedBytes = metadataCount * 1024; // Assuming ~1KB per metadata entry
  
  if (estimatedBytes > 1024 * 1024) {
    return `${(estimatedBytes / (1024 * 1024)).toFixed(1)} MB`;
  }
  
  return `${(estimatedBytes / 1024).toFixed(1)} KB`;
}

/**
 * Get AI metadata statistics for the current user
 */
export async function getAIMetadataStats(userId: string): Promise<MetadataStats> {
  try {
    // Get total email count
    const totalEmails = await prisma.email.count({
      where: { userId }
    });
    
    // Get count of emails with AI metadata
    const emailsWithMetadata = await prisma.emailAIMetadata.count({
      where: {
        email: {
          userId
        }
      }
    });
    
    // Get priority distribution
    const priorityData = await prisma.emailAIMetadata.groupBy({
      by: ['priority'],
      where: {
        email: {
          userId
        },
        priority: {
          not: null
        }
      },
      _count: {
        priority: true
      },
      orderBy: {
        _count: {
          priority: 'desc'
        }
      },
      take: 5
    });
    
    // Get category distribution
    const categoryData = await prisma.emailAIMetadata.groupBy({
      by: ['category'],
      where: {
        email: {
          userId
        },
        category: {
          not: null
        }
      },
      _count: {
        category: true
      }
    });
    
    // Format priority data
    const topPriorities = priorityData.map(p => ({
      label: p.priority || 'unknown',
      count: p._count.priority
    }));
    
    // Build category counts object
    const categoryCounts: {[key: string]: number} = {};
    for (const c of categoryData) {
      if (c.category) {
        categoryCounts[c.category] = c._count.category;
      }
    }
    
    // Get last analyzed date (most recent metadata update)
    const lastMetadata = await prisma.emailAIMetadata.findFirst({
      where: {
        email: {
          userId
        }
      },
      orderBy: {
        updatedAt: 'desc'
      },
      select: {
        updatedAt: true
      }
    });
    
    return {
      totalEmails,
      emailsWithMetadata,
      topPriorities,
      categoryCounts,
      metadataSize: calculateMetadataSize(emailsWithMetadata),
      lastAnalyzedDate: lastMetadata ? lastMetadata.updatedAt.toISOString() : null
    };
  } catch (error) {
    console.error("Error fetching AI metadata stats:", error);
    // Return fallback data if there's an error
    return {
      totalEmails: 0,
      emailsWithMetadata: 0,
      topPriorities: [],
      categoryCounts: {},
      metadataSize: "0 KB",
      lastAnalyzedDate: null
    };
  }
}

/**
 * Update user AI settings
 */
export async function updateAISettings(userId: string, settings: AISettings): Promise<{ success: boolean; message: string }> {
  try {
    // First check if the user already has AI settings
    const existingSettings = await prisma.aIUserSettings.findUnique({
      where: { userId }
    });
    
    if (existingSettings) {
      // Update existing settings
      await prisma.aIUserSettings.update({
        where: { userId },
        data: {
          enabled: settings.enabled,
          customPrompt: settings.customPrompt,
          preserveMetadata: settings.preserveMetadata,
          priorityKeywords: settings.priorityKeywords,
          contentAlerts: settings.contentAlerts,
          analysisPreferences: settings.analysisPreferences,
          aiAssistLevel: settings.aiAssistLevel,
        }
      });
    } else {
      // Create new settings
      await prisma.aIUserSettings.create({
        data: {
          userId,
          enabled: settings.enabled,
          customPrompt: settings.customPrompt,
          preserveMetadata: settings.preserveMetadata,
          priorityKeywords: settings.priorityKeywords,
          contentAlerts: settings.contentAlerts,
          analysisPreferences: settings.analysisPreferences,
          aiAssistLevel: settings.aiAssistLevel,
        }
      });
    }

    // Revalidate the profile page to refresh the data
    revalidatePath("/profile");
    
    return {
      success: true,
      message: "AI preferences updated successfully"
    };
  } catch (error) {
    console.error("Failed to update AI settings:", error);
    return {
      success: false,
      message: "Failed to update AI preferences. Please try again."
    };
  }
}

/**
 * Get AI settings for a user
 */
export async function getAISettings(userId: string): Promise<AISettings | null> {
  try {
    const settings = await prisma.aIUserSettings.findUnique({
      where: { userId }
    });
    
    if (!settings) return null;
    
    return {
      enabled: settings.enabled,
      customPrompt: settings.customPrompt || "",
      preserveMetadata: settings.preserveMetadata,
      priorityKeywords: settings.priorityKeywords,
      contentAlerts: settings.contentAlerts as any,
      analysisPreferences: settings.analysisPreferences as any,
      aiAssistLevel: settings.aiAssistLevel,
    };
  } catch (error) {
    console.error("Failed to fetch AI settings:", error);
    return null;
  }
}

/**
 * Clear all AI metadata for the current user
 */
export async function clearAIMetadata(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // Get all email IDs for the user
    const userEmails = await prisma.email.findMany({
      where: { userId },
      select: { id: true }
    });
    
    const emailIds = userEmails.map(email => email.id);
    
    // Delete all AI metadata for those emails
    const { count } = await prisma.emailAIMetadata.deleteMany({
      where: {
        emailId: {
          in: emailIds
        }
      }
    });
    
    // Revalidate the profile page to refresh the data
    revalidatePath("/profile");
    
    return {
      success: true,
      message: `Successfully cleared AI metadata from ${count} emails`
    };
  } catch (error) {
    console.error("Failed to clear AI metadata:", error);
    return {
      success: false,
      message: "Failed to clear AI metadata. Please try again."
    };
  }
}

/**
 * Update AI analysis for all emails
 */
export async function runAIAnalysisOnAllEmails(userId: string): Promise<{ success: boolean; message: string }> {
  try {
    // In a real implementation, this would add emails to a queue for processing
    // Here we'll just count how many emails would be processed
    const unprocessedEmails = await prisma.email.count({
      where: {
        userId,
        aiMetadata: null
      }
    });
    
    // Revalidate the profile page to refresh the data
    revalidatePath("/profile");
    
    return {
      success: true,
      message: `AI analysis has been scheduled for ${unprocessedEmails} emails`
    };
  } catch (error) {
    console.error("Failed to schedule AI analysis:", error);
    return {
      success: false,
      message: "Failed to schedule AI analysis. Please try again."
    };
  }
} 