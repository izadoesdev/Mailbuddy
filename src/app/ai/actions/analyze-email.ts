 'use server'

import { analyzeEmail } from '../utils/groq';
import { categorizeEmail } from '../utils/categorize';
import { PrismaClient } from '@prisma/client';
import { revalidatePath } from 'next/cache';

const prisma = new PrismaClient();

/**
 * Analyze an email and store the results in the database
 */
export async function analyzeEmailAction(emailId: string) {
  try {
    // First, get the email from the database
    const email = await prisma.email.findUnique({
      where: { id: emailId },
      include: { aiMetadata: true }
    });

    if (!email) {
      throw new Error(`Email with ID ${emailId} not found`);
    }

    const startTime = Date.now();
    
    // Get categories using the enhanced categorization
    const categoryResult = await categorizeEmail(email.body || '', true);
    
    // Get comprehensive analysis if Groq is available
    const analysisResult = await analyzeEmail({
      subject: email.subject || '',
      body: email.body || '',
      from: email.from || '',
      to: email.to || '',
      createdAt: email.createdAt
    });

    const processingTime = Date.now() - startTime;

    // Create or update the AI metadata for this email
    await prisma.emailAIMetadata.upsert({
      where: { emailId: email.id },
      create: {
        emailId: email.id,
        // Primary category from categorization
        category: categoryResult?.primaryCategory || null,
        // All categories above threshold
        categories: categoryResult?.categories?.map((c: any) => c.category) || [],
        // Store confidence scores
        categoryConfidences: categoryResult?.categories || null,
        // Store sentiment analysis if available
        sentiment: analysisResult?.sentiment || null,
        importance: analysisResult?.importance || null,
        requiresResponse: analysisResult?.requiresResponse || false,
        responseTimeframe: analysisResult?.responseTimeframe || null,
        keywords: analysisResult?.keywords || [],
        summary: analysisResult?.summary || null,
        processingTime,
        modelUsed: 'groq:llama3-8b-8192',
        tokensUsed: 0, // Would need token counting integration
        createdAt: new Date(),
        updatedAt: new Date()
      },
      update: {
        category: categoryResult?.primaryCategory || null,
        categories: categoryResult?.categories?.map((c: any) => c.category) || [],
        categoryConfidences: categoryResult?.categories || null,
        sentiment: analysisResult?.sentiment || null,
        importance: analysisResult?.importance || null,
        requiresResponse: analysisResult?.requiresResponse || false,
        responseTimeframe: analysisResult?.responseTimeframe || null,
        keywords: analysisResult?.keywords || [],
        summary: analysisResult?.summary || null,
        processingTime,
        modelUsed: 'groq:llama3-8b-8192',
        updatedAt: new Date()
      }
    });

    // Revalidate the inbox and email path
    revalidatePath('/inbox');
    revalidatePath(`/email/${emailId}`);

    return {
      success: true,
      emailId,
      categories: categoryResult?.categories?.map((c: any) => c.category) || [],
      primaryCategory: categoryResult?.primaryCategory || null,
      sentiment: analysisResult?.sentiment || null,
      importance: analysisResult?.importance || null,
      requiresResponse: analysisResult?.requiresResponse || false,
      processingTime
    };
  } catch (error) {
    console.error('Error analyzing email:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}

/**
 * Generate a response to an email
 */
export async function generateEmailResponseAction(
  emailId: string, 
  instructions?: string
) {
  try {
    // Get the email from the database
    const email = await prisma.email.findUnique({
      where: { id: emailId }
    });

    if (!email) {
      throw new Error(`Email with ID ${emailId} not found`);
    }

    // Import dynamically to avoid issues with server components
    const { generateEmailResponse } = await import('../utils/groq');
    
    // Generate response
    const response = await generateEmailResponse(
      {
        subject: email.subject || '',
        body: email.body || '',
        from: email.from || '',
        to: email.to || ''
      },
      instructions
    );

    return {
      success: true,
      emailId,
      response
    };
  } catch (error) {
    console.error('Error generating email response:', error);
    return {
      success: false,
      error: (error as Error).message
    };
  }
}