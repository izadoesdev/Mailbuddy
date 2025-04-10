import Groq from 'groq-sdk';
import pLimit from 'p-limit';
import { type EmailAnalysis, createAnalysisPrompt, prepareEmailForAnalysis } from './emailProcessing';

// Initialize Groq client (assuming environment variable is set)
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
    // General email processing system prompt - More specific about capabilities
    EMAIL_ASSISTANT:
        `You are an advanced AI Email Assistant designed for efficiency and accuracy.
        Your purpose is to help users manage their inbox by performing specific tasks when requested, such as:
        - Summarizing email content concisely.
        - Extracting key information (action items, dates, contacts).
        - Categorizing emails based on predefined criteria or content analysis.
        - Assessing email priority (urgency and importance).
        - Drafting context-aware replies (when explicitly asked).

        Always base your responses *strictly* on the provided email content (subject, body, sender, timestamp).
        Do not infer external information or make assumptions beyond the text.
        Maintain a professional, neutral, and helpful tone.
        Ensure your output is clear, concise, and directly addresses the user's request.`,

    // Email categorization specialized system prompt - Stricter output, clearer instructions
    EMAIL_CATEGORIZER:
        `You are an AI expert focused *solely* on email categorization.
        Your task is to analyze the provided email's subject, sender, and body content to determine the single most fitting category.
        Carefully consider the primary topic, purpose, and tone of the email.
        You *must* return ONLY the category name as a single string.
        Do NOT include any explanations, introductory phrases (like "The category is:"), or any text other than the category name itself.
        Example Input: Email about a project deadline.
        Example Output: Project Update
        Example Input: Email asking for product information.
        Example Output: Inquiry
        [Optional: If predefined categories are provided later, adhere strictly to that list.]`, // Placeholder for future flexibility

    // Email summarization specialized system prompt - More detailed guidance on what to include/exclude
    EMAIL_SUMMARIZER:
        `You are an AI expert specialized in creating *actionable* email summaries.
        Your goal is to distill the provided email content into its essential components for quick user understanding.
        Focus on extracting:
        - The core message or purpose of the email.
        - Key decisions made or requested.
        - Explicit questions asked.
        - Action items required from the recipient, including any deadlines mentioned.
        - Critical information or data points.

        You *must* ignore:
        - Greetings, salutations, and closings (e.g., "Hi John," "Best regards,").
        - Pleasantries and conversational filler (e.g., "Hope you're well,").
        - Redundant information and lengthy background if not essential to the core message.
        - Signatures and contact blocks.

        Present the summary clearly and concisely, often using bullet points for distinct items.
        Do not add opinions or information not present in the original email. The summary should be objective.`,

    // Email prioritization specialized system prompt - Defined scale, structured output
    EMAIL_PRIORITIZER:
        `You are an AI expert specialized in email prioritization.
        Analyze the email's content (subject, body, sender, keywords like 'urgent', 'important', deadlines) to determine its priority level for the recipient.
        Consider both Urgency (time sensitivity) and Importance (impact on goals/work).

        Assign *one* of the following priority ratings: High, Medium, Low.

        You *must* format your response *exactly* as follows, with no additional text:
        Priority: [High/Medium/Low]
        Reason: [A brief, 1-sentence explanation justifying the assigned priority based on specific email content.]

        Example Output 1:
        Priority: High
        Reason: Contains an explicit urgent request from the user's manager with a same-day deadline.

        Example Output 2:
        Priority: Low
        Reason: Appears to be a non-critical newsletter or promotional content.

        Example Output 3:
        Priority: Medium
        Reason: Includes a request for information related to an ongoing project, but no immediate deadline is specified.`,
};

// Common models with specific use cases
export const MODELS = {
    FAST: "llama3-8b-8192",      // Fast, efficient model for simpler tasks (like Categorization with strict output)
    BALANCED: "llama3-70b-8192", // Good balance between performance and quality (good for Summarization, Prioritization)
    POWERFUL: "mixtral-8x7b-32768", // More powerful for complex tasks (potentially better for nuanced Summarization/Prioritization, or complex general assistance) - Note: Might be slower/more expensive.
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

/**
 * Analyze an email using the Groq API
 */
export async function analyzeEmail(
  email: { 
    subject: string; 
    body: string; 
    from?: string; 
    to?: string;
    createdAt?: Date | string;
  }
): Promise<EmailAnalysis | null> {
  if (!process.env.GROQ_API_KEY) {
    console.error('Groq API key is not configured');
    return null;
  }

  try {
    // Prepare the email content for analysis
    const emailContent = prepareEmailForAnalysis(email);
    
    // Generate the prompt for analysis
    const prompt = createAnalysisPrompt(emailContent);
    
    // Call the Groq API
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.1,
      max_tokens: 500,
    });
    
    const response = completion.choices[0]?.message?.content?.trim() || '';
    
    // Extract JSON from the response
    try {
      // Use regex to find JSON object in response (in case there's extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const analysisData = JSON.parse(jsonMatch[0]);
        
        // Validate the response has the required fields
        if (
          typeof analysisData.sentiment === 'string' &&
          typeof analysisData.importance === 'string' &&
          typeof analysisData.requiresResponse === 'boolean' &&
          Array.isArray(analysisData.keywords) &&
          typeof analysisData.summary === 'string'
        ) {
          return analysisData as EmailAnalysis;
        }
      }
      
      console.error('Invalid response format from Groq API:', response);
      return null;
    } catch (parseError) {
      console.error('Error parsing Groq API response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error calling Groq API:', error);
    return null;
  }
}

/**
 * Generate a response to an email based on its content
 */
export async function generateEmailResponse(
  email: { 
    subject: string; 
    body: string; 
    from?: string; 
    to?: string;
  },
  instructions?: string
): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) {
    console.error('Groq API key is not configured');
    return null;
  }

  try {
    // Clean and prepare the email content
    const emailContent = prepareEmailForAnalysis(email);
    
    // Create the prompt for response generation
    const prompt = `
You are drafting an email response to the following message. 
${instructions ? `Instructions: ${instructions}` : ''}
Write a professional, concise, and appropriate response. 
Do not include any email headers, just the body of the response.

Original email:
${emailContent}

Your response:
`;
    
    // Call the Groq API
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama3-8b-8192',
      temperature: 0.7, // Slightly higher temperature for creative response
      max_tokens: 1000,
    });
    
    return completion.choices[0]?.message?.content?.trim() || null;
  } catch (error) {
    console.error('Error generating email response:', error);
    return null;
  }
}