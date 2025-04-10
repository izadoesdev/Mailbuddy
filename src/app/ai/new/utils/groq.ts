'use server'

import index from "../index";
import { AI_PROMPTS, VECTOR_CONFIG } from "../constants";
import type { Email } from "@/app/inbox/types";
import { cleanEmail } from "./clean";

// Default model to use for Groq requests
const DEFAULT_MODEL = "llama3-8b-8192";

/**
 * Make a Groq LLM API call with retry logic
 */
async function callGroq(
  prompt: string,
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<string> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.2,
    maxTokens = 150,
  } = options;

  // Ensure Groq is available
  if (!process.env.GROQ_API_KEY) {
    throw new Error("GROQ_API_KEY not set");
  }

  // Add retry logic for resilience
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
    try {
      const completion = await index.groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model,
        temperature,
        max_tokens: maxTokens,
      });

      return completion.choices[0]?.message?.content?.trim() || "";
    } catch (error) {
      lastError = error as Error;
      attempts++;
      if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
      }
    }
  }

  throw lastError || new Error("Failed to get response from Groq after multiple attempts");
}

/**
 * Categorize an email using Groq LLM
 */
export async function categorizeEmail(email: Email): Promise<string> {
  try {
    const emailText = cleanEmail(email);
    if (!emailText || emailText.length < 10) {
      return "Uncategorized";
    }

    const prompt = `${AI_PROMPTS.CATEGORIZE}
    
    EMAIL:
    ${emailText.substring(0, 3000)}`;

    const result = await callGroq(prompt, { temperature: 0.1 });
    return result;
  } catch (error) {
    console.error("Error categorizing email with Groq:", error);
    return "Uncategorized";
  }
}

/**
 * Prioritize an email using Groq LLM
 */
export async function prioritizeEmail(email: Email): Promise<string> {
  try {
    const emailText = cleanEmail(email);
    if (!emailText || emailText.length < 10) {
      return "Medium";
    }

    const prompt = `${AI_PROMPTS.PRIORITIZE}
    
    EMAIL:
    ${emailText.substring(0, 3000)}`;

    const result = await callGroq(prompt, { temperature: 0.1 });
    return result;
  } catch (error) {
    console.error("Error prioritizing email with Groq:", error);
    return "Medium";
  }
}

/**
 * Summarize an email using Groq LLM
 */
export async function summarizeEmail(email: Email): Promise<string> {
  try {
    const emailText = cleanEmail(email);
    if (!emailText || emailText.length < 30) {
      return "No summary available";
    }

    const prompt = `${AI_PROMPTS.SUMMARIZE}
    
    EMAIL:
    ${emailText.substring(0, 3000)}`;

    const result = await callGroq(prompt, { temperature: 0.3, maxTokens: 200 });
    return result;
  } catch (error) {
    console.error("Error summarizing email with Groq:", error);
    return "Error generating summary";
  }
}

/**
 * Extract action items from an email using Groq LLM
 */
export async function extractActionItems(email: Email): Promise<string[]> {
  try {
    const emailText = cleanEmail(email);
    if (!emailText || emailText.length < 30) {
      return [];
    }

    const prompt = `${AI_PROMPTS.EXTRACT_ACTION_ITEMS}
    
    EMAIL:
    ${emailText.substring(0, 3000)}
    
    Format your response as a JSON array, with each item as a string. If no action items, return an empty array [].`;

    const result = await callGroq(prompt, { temperature: 0.2, maxTokens: 400 });
    
    // Try to extract JSON array from response
    try {
      const match = result.match(/\[([\s\S]*?)\]/);
      if (match) {
        const jsonArray = JSON.parse(match[0]);
        return Array.isArray(jsonArray) ? jsonArray : [];
      }
      
      // If response says "No action items"
      if (result.includes("No action items")) {
        return [];
      }
      
      // If we can't parse JSON but have text, return as single item
      return result ? [result] : [];
    } catch (error) {
      console.error("Error parsing action items JSON:", error);
      return result ? [result] : [];
    }
  } catch (error) {
    console.error("Error extracting action items with Groq:", error);
    return [];
  }
}

/**
 * Extract contact information from an email using Groq LLM
 */
export async function extractContactInfo(email: Email): Promise<Record<string, string>> {
  try {
    const emailText = cleanEmail(email);
    if (!emailText || emailText.length < 30) {
      return {};
    }

    const prompt = `${AI_PROMPTS.EXTRACT_CONTACT_INFO}
    
    EMAIL:
    ${emailText.substring(0, 3000)}
    
    Format your response as a JSON object with contact details as key-value pairs. If no contact info, return an empty object {}.`;

    const result = await callGroq(prompt, { temperature: 0.1, maxTokens: 300 });
    
    // Try to extract JSON object from response
    try {
      const match = result.match(/\{([\s\S]*?)\}/);
      if (match) {
        const jsonObj = JSON.parse(match[0]);
        return typeof jsonObj === 'object' ? jsonObj : {};
      }
      
      // If response indicates no contact info
      if (result.includes("No contact information")) {
        return {};
      }
      
      return {};
    } catch (error) {
      console.error("Error parsing contact info JSON:", error);
      return {};
    }
  } catch (error) {
    console.error("Error extracting contact info with Groq:", error);
    return {};
  }
}

/**
 * Process all AI enhancements for an email in a single call
 */
export async function processEmail(email: Email) {
  try {
    // Prepare email text once to avoid repetitive cleaning
    const emailText = cleanEmail(email);
    
    if (!emailText || emailText.length < 30) {
      return {
        category: "Uncategorized",
        priority: "Medium",
        summary: "No summary available",
        actionItems: [],
        contactInfo: {}
      };
    }
    
    // Create a comprehensive prompt that extracts all information at once
    const prompt = `Analyze this email and provide the following information in JSON format:
    
    1. category: Choose one from [${AI_PROMPTS.CATEGORIZE}]
    2. priority: Choose one from [${Object.values(AI_PROMPTS.PRIORITIZE)}]
    3. summary: ${AI_PROMPTS.SUMMARIZE}
    4. actionItems: ${AI_PROMPTS.EXTRACT_ACTION_ITEMS}
    5. contactInfo: ${AI_PROMPTS.EXTRACT_CONTACT_INFO}
    
    EMAIL:
    ${emailText.substring(0, 3000)}
    
    Format your response as a single valid JSON object with these 5 fields.`;
    
    const result = await callGroq(prompt, { temperature: 0.2, maxTokens: 800 });
    
    // Try to extract JSON from the response
    try {
      // Find first occurrence of a JSON object
      const match = result.match(/\{[\s\S]*\}/);
      if (match) {
        const jsonObj = JSON.parse(match[0]);
        
        return {
          category: jsonObj.category || "Uncategorized",
          priority: jsonObj.priority || "Medium",
          summary: jsonObj.summary || "No summary available",
          actionItems: Array.isArray(jsonObj.actionItems) ? jsonObj.actionItems : [],
          contactInfo: typeof jsonObj.contactInfo === 'object' ? jsonObj.contactInfo : {}
        };
      }
    } catch (error) {
      console.error("Error parsing comprehensive email analysis JSON:", error);
    }
    
    // Fallback to individual processing if batch processing fails
    return {
      category: await categorizeEmail(email),
      priority: await prioritizeEmail(email),
      summary: await summarizeEmail(email),
      actionItems: await extractActionItems(email),
      contactInfo: await extractContactInfo(email)
    };
  } catch (error) {
    console.error("Error in comprehensive email processing:", error);
    return {
      category: "Uncategorized",
      priority: "Medium",
      summary: "Error processing email",
      actionItems: [],
      contactInfo: {}
    };
  }
}
