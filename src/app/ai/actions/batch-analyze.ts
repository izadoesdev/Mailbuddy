'use server'

import { PrismaClient } from '@prisma/client';
import pLimit from 'p-limit';
import { analyzeEmailAction } from './analyze-email';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

/**
 * Analyze a batch of emails by their IDs
 */
export async function batchAnalyzeEmails(emailIds: string[], concurrency = 2) {
  try {
    // Use pLimit to control concurrency and avoid rate limits
    const limit = pLimit(concurrency);
    
    // Process all emails with limited concurrency
    const analysisPromises = emailIds.map(emailId => 
      limit(() => analyzeEmailAction(emailId))
    );
    
    // Wait for all analysis to complete
    const results = await Promise.all(analysisPromises);
    
    // Count successes and failures
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;
    
    // Revalidate inbox to show updated data
    revalidatePath('/inbox');
    
    return {
      success: true,
      totalProcessed: emailIds.length,
      successCount,
      failureCount,
      results
    };
  } catch (error) {
    console.error('Error in batch email analysis:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Analyze all unprocessed emails for a user
 */
export async function analyzeUnprocessedEmails(userId: string, limit = 50) {
  try {
    // Find emails that haven't been analyzed yet
    const unprocessedEmails = await prisma.email.findMany({
      where: {
        userId,
        aiMetadata: null // No AI metadata exists yet
      },
      take: limit,
      orderBy: {
        createdAt: 'desc' // Start with newest emails
      }
    });
    
    if (unprocessedEmails.length === 0) {
      return {
        success: true,
        message: 'No unprocessed emails found',
        processed: 0
      };
    }
    
    // Process these emails
    const emailIds = unprocessedEmails.map(email => email.id);
    const result = await batchAnalyzeEmails(emailIds);
    
    return {
      processed: result.successCount,
      total: unprocessedEmails.length,
      ...result
    };
  } catch (error) {
    console.error('Error analyzing unprocessed emails:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
} 