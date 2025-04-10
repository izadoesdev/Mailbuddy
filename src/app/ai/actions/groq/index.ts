'use server'

import Groq from 'groq-sdk';
import pLimit from 'p-limit';

// Initialize Groq client
const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
    // Add timeout and retry options for better reliability
    timeout: 30000, // 30 seconds timeout
    maxRetries: 3,  // Retry failed requests up to 3 times
});

// Create a concurrency limiter to control API requests (10 concurrent requests max)
const limiter = pLimit(10);

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

/**
 * Get the Groq client instance
 */
export async function getGroqClient() {
    return groq;
}

/**
 * Process multiple prompts concurrently with rate limiting
 * @param prompts Array of prompt objects containing messages and model
 * @param options Optional configuration
 */
export async function processBatch(
    prompts: Array<{
        messages: Groq.Chat.ChatCompletionMessageParam[],
        model: string,
    }>,
    options: {
        temperature?: number,
        maxRetries?: number,
        timeout?: number
    } = {}
) {
    // Process prompts concurrently but with controlled concurrency
    const results = await Promise.all(
        prompts.map(prompt => 
            limiter(() => processPrompt(prompt.messages, prompt.model, options))
        )
    );
    
    return results;
}

/**
 * Process a single prompt with the Groq API
 * @param messages The messages to send to the API
 * @param model The model to use
 * @param options Optional configuration
 */
export async function processPrompt(
    messages: Groq.Chat.ChatCompletionMessageParam[],
    model: string = MODELS.BALANCED,
    options: {
        temperature?: number,
        maxRetries?: number,
        timeout?: number
    } = {}
) {
    try {
        const response = await groq.chat.completions.create({
            messages,
            model,
            temperature: options.temperature ?? 0.2, // Lower temperature for more consistent results
            stream: false,
            // If provided, override the default client settings
            ...(options.maxRetries !== undefined && { maxRetries: options.maxRetries }),
            ...(options.timeout !== undefined && { timeout: options.timeout }),
        });
        
        return {
            success: true,
            content: response.choices[0].message.content,
            usage: response.usage,
        };
    } catch (error) {
        console.error('Error processing prompt with Groq:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : String(error),
        };
    }
}

/**
 * Create a function that uses a specific system prompt
 * @param systemPrompt The system prompt to use
 * @returns A function that takes a user message and returns a chat completion
 */
export function createPromptFunction(systemPrompt: string) {
    return async (userContent: string, model: string = MODELS.BALANCED) => {
        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];
        
        return processPrompt(messages, model);
    };
}


