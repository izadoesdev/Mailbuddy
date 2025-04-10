import { groq, limiter } from '@/app/ai/utils/groq';
import type { Groq } from 'groq-sdk';

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
    model: string,
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
export async function createPromptFunction(systemPrompt: string) {
    return async (userContent: string, model: string) => {
        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];
        
        return processPrompt(messages, model);
    };
}


