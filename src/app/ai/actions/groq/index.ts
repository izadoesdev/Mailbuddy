import { groq, limiter } from '@/app/ai/utils/groq';
import type { Groq } from 'groq-sdk';

// Helper for logging
const log = (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [Groq API] ${message}`, data ? data : "");
};

/**
 * Get the Groq client instance
 */
export async function getGroqClient() {
    log("Getting Groq client instance");
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
    log(`Processing batch of ${prompts.length} prompts with concurrency limit`);
    const startTime = Date.now();
    
    // Process prompts concurrently but with controlled concurrency
    const results = await Promise.all(
        prompts.map((prompt, index) => 
            limiter(async () => {
                log(`Processing batch item ${index + 1}/${prompts.length}, model: ${prompt.model}`);
                return processPrompt(prompt.messages, prompt.model, options);
            })
        )
    );
    
    const duration = Date.now() - startTime;
    log(`Batch processing completed in ${duration}ms`, {
        totalPrompts: prompts.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length
    });
    
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
    const startTime = Date.now();
    const systemPrompt = messages.find(m => m.role === 'system')?.content || '';
    const systemPromptPreview = `${systemPrompt.substring(0, 50)}${systemPrompt.length > 50 ? '...' : ''}`;
    
    log(`Processing prompt with model ${model}`, {
        temperature: options.temperature ?? 0.2,
        messageCount: messages.length,
        systemPrompt: systemPromptPreview
    });
    
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
        
        const duration = Date.now() - startTime;
        log(`Prompt processed successfully in ${duration}ms`, {
            model,
            promptTokens: response.usage?.prompt_tokens,
            completionTokens: response.usage?.completion_tokens,
            totalTokens: response.usage?.total_tokens,
            responseLength: response.choices[0].message.content?.length
        });
        
        return {
            success: true,
            content: response.choices[0].message.content,
            usage: response.usage,
        };
    } catch (error) {
        const duration = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : String(error);
        log(`Error processing prompt (${duration}ms): ${errorMessage}`, {
            model,
            error: errorMessage
        });
        
        return {
            success: false,
            error: errorMessage,
        };
    }
}

/**
 * Create a function that uses a specific system prompt
 * @param systemPrompt The system prompt to use
 * @returns A function that takes a user message and returns a chat completion
 */
export async function createPromptFunction(systemPrompt: string) {
    const systemPromptPreview = `${systemPrompt.substring(0, 50)}${systemPrompt.length > 50 ? '...' : ''}`;
    
    log("Creating prompt function with system prompt", {
        systemPromptPreview
    });
    
    return async (userContent: string, model: string) => {
        const userContentPreview = `${userContent.substring(0, 50)}${userContent.length > 50 ? '...' : ''}`;
        
        log("Executing prompt function", {
            model,
            userContentPreview
        });
        
        const messages: Groq.Chat.ChatCompletionMessageParam[] = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userContent }
        ];
        
        return processPrompt(messages, model);
    };
}


