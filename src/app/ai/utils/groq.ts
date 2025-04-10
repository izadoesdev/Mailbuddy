import Groq from 'groq-sdk';
import pLimit from 'p-limit';

// Initialize Groq client
export const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    // Add timeout and retry options for better reliability
    timeout: 30000, // 30 seconds timeout
    maxRetries: 3,  // Retry failed requests up to 3 times
});

// Create a concurrency limiter to control API requests (10 concurrent requests max)
export const limiter = pLimit(10);

// Reusable system prompts that can be composed modularly
export const SYSTEM_PROMPTS = {
    // General email processing system prompt
    EMAIL_ASSISTANT: 
        `You are an AI email assistant that helps users process and organize their emails efficiently.
        You strive to provide accurate, concise, and helpful responses.`,
    
    // Email categorization specialized system prompt
    EMAIL_CATEGORIZER:
        `You are an AI email categorization expert. Your task is to analyze email content and determine the most appropriate category.
        Categorize accurately based on the content, tone, and purpose of the email. Be precise and consistent.
        Return only the category name without any explanation or additional text.`,
    
    // Email summarization specialized system prompt
    EMAIL_SUMMARIZER:
        `You are an AI email summarization expert. Your task is to analyze email content and create a concise summary.
        Extract the key points, action items, and important details. Ignore pleasantries and signatures.
        Be precise and concise. Focus on what's truly important to the recipient.`,
    
    // Email prioritization specialized system prompt
    EMAIL_PRIORITIZER:
        `You are an AI email prioritization expert. Your task is to analyze email content and determine its urgency and importance.
        Consider deadlines, the sender's role, explicit requests, and the nature of the content.
        Return a priority rating and a brief explanation of your reasoning.`,
};

// Common models with specific use cases
export const MODELS = {
    FAST: "llama3-8b-8192",      // Fast, efficient model for simpler tasks
    BALANCED: "llama3-70b-8192", // Good balance between performance and quality
    POWERFUL: "mixtral-8x7b-32768", // More powerful for complex tasks
};

// Types for email processing
export type EmailInput = {
  id: string;
  subject: string;
  body: string;
  from?: string;
  to?: string;
  createdAt?: Date | string;
};

export type ProcessOptions = {
  forceReprocess?: boolean;
  modelOverride?: string;
}; 