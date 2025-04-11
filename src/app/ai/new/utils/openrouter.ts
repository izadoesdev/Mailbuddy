"use server";

import index from "../index";
import { AI_PROMPTS, VECTOR_CONFIG, PRIORITY_LEVELS } from "../constants";
import type { Email } from "@/app/inbox/types";
import { cleanEmail } from "./clean";

// Default model to use for OpenRouter requests
const DEFAULT_MODEL = "meta-llama/llama-3.1-8b-instruct";

/**
 * Make an OpenRouter LLM API call with retry logic
 */
async function callOpenRouter(
    prompt: string,
    options: {
        model?: string;
        temperature?: number;
        maxTokens?: number;
    } = {},
): Promise<string> {
    const { model = DEFAULT_MODEL, temperature = 0.2, maxTokens = 150 } = options;

    // Ensure OpenRouter API key is available
    if (!process.env.OPENROUTER_API_KEY) {
        throw new Error("OPENROUTER_API_KEY not set");
    }

    // Add retry logic for resilience
    let attempts = 0;
    let lastError: Error | null = null;

    while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
        try {
            const completion = await index.openrouter.chat.completions.create({
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
                await new Promise((resolve) => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
            }
        }
    }

    throw lastError || new Error("Failed to get response from OpenRouter after multiple attempts");
}

/**
 * Categorize an email using OpenRouter LLM
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

        const result = await callOpenRouter(prompt, { temperature: 0.1 });
        return result;
    } catch (error) {
        console.error("Error categorizing email with OpenRouter:", error);
        return "Uncategorized";
    }
}

/**
 * Prioritize an email using OpenRouter LLM
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

        const result = await callOpenRouter(prompt, { temperature: 0.1 });

        // Validate that the response is a valid priority level
        const validPriorities = Object.values(PRIORITY_LEVELS);
        if (validPriorities.includes(result)) {
            return result;
        }

        // If not valid, return default
        return "Medium";
    } catch (error) {
        console.error("Error prioritizing email with OpenRouter:", error);
        return "Medium";
    }
}

/**
 * Summarize an email using OpenRouter LLM
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

        const result = await callOpenRouter(prompt, { temperature: 0.3, maxTokens: 200 });
        return result;
    } catch (error) {
        console.error("Error summarizing email with OpenRouter:", error);
        return "Error generating summary";
    }
}

/**
 * Extract action items from an email using OpenRouter LLM
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

        const result = await callOpenRouter(prompt, { temperature: 0.2, maxTokens: 400 });

        // Try to extract JSON array from response
        try {
            const match = result.match(/\[([\s\S]*?)\]/);
            if (match) {
                // Clean up the JSON before parsing
                let jsonStr = match[0];

                // Replace potential formatting issues from Gemini model
                jsonStr = jsonStr
                    // Fix single quotes to double quotes
                    .replace(/'/g, '"')
                    // Remove trailing commas before closing brackets
                    .replace(/,\s*]/g, "]");

                // Try parsing the cleaned JSON
                const jsonArray = JSON.parse(jsonStr);
                return Array.isArray(jsonArray) ? jsonArray : [];
            }

            // If response says "No action items"
            if (result.includes("No action items")) {
                return [];
            }

            // Fallback: try to extract bullet points or numbered items if JSON parsing fails
            const bulletItems = result.match(/(?:^|\n)[-*•]\s*(.+)(?:\n|$)/g);
            if (bulletItems?.length) {
                return bulletItems.map((item) => item.replace(/^[-*•]\s*/, "").trim());
            }

            const numberedItems = result.match(/(?:^|\n)\d+\.\s*(.+)(?:\n|$)/g);
            if (numberedItems?.length) {
                return numberedItems.map((item) => item.replace(/^\d+\.\s*/, "").trim());
            }

            // If we can't parse JSON but have text, return as single item
            return result ? [result] : [];
        } catch (error) {
            console.error("Error parsing action items JSON:", error);
            console.error("Raw result:", result);

            // Fallback: try to extract bullet points or numbered items
            const bulletItems = result.match(/(?:^|\n)[-*•]\s*(.+)(?:\n|$)/g);
            if (bulletItems?.length) {
                return bulletItems.map((item) => item.replace(/^[-*•]\s*/, "").trim());
            }

            const numberedItems = result.match(/(?:^|\n)\d+\.\s*(.+)(?:\n|$)/g);
            if (numberedItems?.length) {
                return numberedItems.map((item) => item.replace(/^\d+\.\s*/, "").trim());
            }

            return result ? [result] : [];
        }
    } catch (error) {
        console.error("Error extracting action items with OpenRouter:", error);
        return [];
    }
}

/**
 * Extract contact information from an email using OpenRouter LLM
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

        const result = await callOpenRouter(prompt, { temperature: 0.1, maxTokens: 300 });

        // Try to extract JSON object from response
        try {
            const match = result.match(/\{([\s\S]*?)\}/);
            if (match) {
                // Clean up the JSON before parsing
                let jsonStr = match[0];

                // Replace potential formatting issues from Gemini model
                jsonStr = jsonStr
                    // Fix unquoted property names
                    .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')
                    // Fix single quotes to double quotes
                    .replace(/'/g, '"')
                    // Remove trailing commas before closing brackets
                    .replace(/,\s*}/g, "}");

                // Try parsing the cleaned JSON
                const jsonObj = JSON.parse(jsonStr);
                return typeof jsonObj === "object" ? jsonObj : {};
            }

            // If response indicates no contact info
            if (result.includes("No contact information")) {
                return {};
            }

            // Fallback: try to extract key-value pairs if JSON parsing fails
            const contactInfo: Record<string, string> = {};

            // Look for Email: something@example.com patterns
            const emailMatch = result.match(
                /email:?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            );
            if (emailMatch?.[1]) contactInfo.email = emailMatch[1].trim();

            // Look for Phone: 123-456-7890 patterns
            const phoneMatch = result.match(/phone:?\s*([\d\s+\-()]{7,})/i);
            if (phoneMatch?.[1]) contactInfo.phone = phoneMatch[1].trim();

            // Look for Name: John Doe patterns
            const nameMatch = result.match(/name:?\s*([^:,\n]{2,})/i);
            if (nameMatch?.[1]) contactInfo.name = nameMatch[1].trim();

            if (Object.keys(contactInfo).length > 0) {
                return contactInfo;
            }

            return {};
        } catch (error) {
            console.error("Error parsing contact info JSON:", error);
            console.error("Raw result:", result);

            // Fallback: try to extract key-value pairs
            const contactInfo: Record<string, string> = {};

            // Look for Email: something@example.com patterns
            const emailMatch = result.match(
                /email:?\s*([a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
            );
            if (emailMatch?.[1]) contactInfo.email = emailMatch[1].trim();

            // Look for Phone: 123-456-7890 patterns
            const phoneMatch = result.match(/phone:?\s*([\d\s+\-()]{7,})/i);
            if (phoneMatch?.[1]) contactInfo.phone = phoneMatch[1].trim();

            // Look for Name: John Doe patterns
            const nameMatch = result.match(/name:?\s*([^:,\n]{2,})/i);
            if (nameMatch?.[1]) contactInfo.name = nameMatch[1].trim();

            return contactInfo;
        }
    } catch (error) {
        console.error("Error extracting contact info with OpenRouter:", error);
        return {};
    }
}

/**
 * Helper function to extract and clean JSON from a response string
 */
function extractJsonFromText(text: string): any | null {
    // First try to extract JSON using regex
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
        try {
            // Clean up the JSON before parsing
            let jsonStr = jsonMatch[0];

            // Replace potential formatting issues from LLMs
            jsonStr = jsonStr
                // Fix unquoted property names
                .replace(/(\s*?{\s*?|\s*?,\s*?)(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '$1"$3":')
                // Fix single quotes to double quotes
                .replace(/'/g, '"')
                // Remove trailing commas before closing brackets
                .replace(/,\s*}/g, "}")
                .replace(/,\s*]/g, "]");

            // Try parsing the cleaned JSON
            return JSON.parse(jsonStr);
        } catch (error) {
            console.error("Error parsing cleaned JSON:", error);
            return null;
        }
    }

    return null;
}

/**
 * Process all AI enhancements for an email in a single call
 */
export async function processEmail(email: Email) {
    try {
        // Prepare email text once to avoid repetitive cleaning
        const emailText = cleanEmail(email);
        console.log("Cleaned email text: ", emailText);

        if (!emailText || emailText.length < 30) {
            return {
                category: "Uncategorized",
                priority: "Medium",
                priorityExplanation: "Email content too short to analyze",
                summary: "No summary available",
                actionItems: [],
                contactInfo: {},
            };
        }

        // Create a comprehensive prompt that extracts all information at once
        const prompt = `Analyze this email and provide the following information in JSON format.
    
IMPORTANT: Your output MUST follow this exact JSON format with all fields properly quoted:
{
  "category": "Choose from this list: ${AI_PROMPTS.CATEGORIZE}",
  "priority": "Choose one from this list: ${Object.values(PRIORITY_LEVELS).join(", ")}",
  "priorityExplanation": "Briefly explain why you assigned this priority level",
  "summary": "Provide a concise summary of this email in 1-2 sentences",
  "actionItems": ["List action items as array of strings. If none, use empty array"],
  "contactInfo": {"name": "John Doe", "email": "email if found", "phone": "phone if found"}
}
    
EMAIL:
${emailText.substring(0, 3000)}

Remember to ONLY return a valid JSON object.`;

        // Use a more powerful model for comprehensive analysis
        const result = await callOpenRouter(prompt, {
            model: "google/gemini-flash-1.5-8b",
            temperature: 0.2,
            maxTokens: 800,
        });

        // Try to extract JSON from the response
        try {
            // Use our helper function for more robust extraction
            const jsonObj = extractJsonFromText(result);

            if (jsonObj) {
                console.log("Successfully parsed JSON response");
                return {
                    category: jsonObj.category || "Uncategorized",
                    priority: jsonObj.priority || "Medium",
                    priorityExplanation: jsonObj.priorityExplanation || "",
                    summary: jsonObj.summary || "No summary available",
                    actionItems: Array.isArray(jsonObj.actionItems) ? jsonObj.actionItems : [],
                    contactInfo: typeof jsonObj.contactInfo === "object" ? jsonObj.contactInfo : {},
                };
            }

            // If no JSON could be extracted, try regex-based extraction as fallback
            // Additional fallback - try to extract individual fields from the text response
            const categoryMatch = result.match(/category["\s:]+([^"\n,]+)/i);
            const priorityMatch = result.match(/priority["\s:]+([^"\n,]+)/i);
            const summaryMatch = result.match(/summary["\s:]+([^"\n}]+)/i);

            const extractedData: any = {};
            if (categoryMatch?.[1]) extractedData.category = categoryMatch[1].trim();
            if (priorityMatch?.[1]) extractedData.priority = priorityMatch[1].trim();
            if (summaryMatch?.[1]) extractedData.summary = summaryMatch[1].trim();

            if (Object.keys(extractedData).length > 0) {
                console.log("Extracted partial data from text:", extractedData);
                return {
                    category: extractedData.category || "Uncategorized",
                    priority: extractedData.priority || "Medium",
                    priorityExplanation: "Extracted from malformed response",
                    summary: extractedData.summary || "No summary available",
                    actionItems: [],
                    contactInfo: {},
                };
            }
        } catch (error) {
            console.error("Error parsing comprehensive email analysis JSON:", error);
            console.error("Raw result:", result);

            // Additional fallback - try to extract individual fields from the text response
            const categoryMatch = result.match(/category["\s:]+([^"\n,]+)/i);
            const priorityMatch = result.match(/priority["\s:]+([^"\n,]+)/i);
            const summaryMatch = result.match(/summary["\s:]+([^"\n}]+)/i);

            const extractedData: any = {};
            if (categoryMatch?.[1]) extractedData.category = categoryMatch[1].trim();
            if (priorityMatch?.[1]) extractedData.priority = priorityMatch[1].trim();
            if (summaryMatch?.[1]) extractedData.summary = summaryMatch[1].trim();

            if (Object.keys(extractedData).length > 0) {
                console.log("Extracted partial data from text:", extractedData);
                return {
                    category: extractedData.category || "Uncategorized",
                    priority: extractedData.priority || "Medium",
                    priorityExplanation: "Extracted from malformed response",
                    summary: extractedData.summary || "No summary available",
                    actionItems: [],
                    contactInfo: {},
                };
            }
        }

        // Fallback to individual processing if batch processing fails
        // Get priority with explanation
        const priorityInfo = await getPriorityWithExplanation(email);

        return {
            category: await categorizeEmail(email),
            priority: priorityInfo.priority,
            priorityExplanation: priorityInfo.explanation,
            summary: await summarizeEmail(email),
            actionItems: await extractActionItems(email),
            contactInfo: await extractContactInfo(email),
        };
    } catch (error) {
        console.error("Error in comprehensive email processing:", error);
        return {
            category: "Uncategorized",
            priority: "Medium",
            priorityExplanation: "Error during processing",
            summary: "Error processing email",
            actionItems: [],
            contactInfo: {},
        };
    }
}

/**
 * Get priority with explanation for an email
 */
async function getPriorityWithExplanation(
    email: Email,
): Promise<{ priority: string; explanation: string }> {
    try {
        const emailText = cleanEmail(email);
        if (!emailText || emailText.length < 10) {
            return {
                priority: "Medium",
                explanation: "Email content too short to analyze",
            };
        }

        const prompt = `Based on the content, urgency, and importance of this email, assign a priority level from these options: 
    ${Object.values(PRIORITY_LEVELS).join(", ")}. 
    
    First provide the priority level, then explain why you assigned this priority in a separate paragraph.
    
    EMAIL:
    ${emailText.substring(0, 3000)}`;

        const result = await callOpenRouter(prompt, { temperature: 0.1, maxTokens: 300 });

        // Extract priority level (first line or word)
        let priority = "Medium";
        let explanation = "";

        // Try to parse the response
        const lines = result.split("\n").filter((line) => line.trim().length > 0);
        if (lines.length > 0) {
            // First line or word should be the priority
            const firstLine = lines[0].trim();
            const validPriorities = Object.values(PRIORITY_LEVELS);

            // Check if the first line is just a priority
            if (validPriorities.includes(firstLine)) {
                priority = firstLine;
                // Explanation is everything after the first line
                explanation = lines.slice(1).join("\n").trim();
            } else {
                // Try to extract a valid priority from the first line/word
                for (const validPriority of validPriorities) {
                    if (firstLine.includes(validPriority)) {
                        priority = validPriority;
                        break;
                    }
                }
                // Everything else is the explanation
                explanation = result.replace(priority, "").trim();
            }
        }

        return {
            priority,
            explanation:
                explanation || `Determined to be ${priority} priority based on content analysis.`,
        };
    } catch (error) {
        console.error("Error determining priority with explanation:", error);
        return {
            priority: "Medium",
            explanation: "Error during priority analysis",
        };
    }
}
