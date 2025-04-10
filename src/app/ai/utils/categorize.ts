'use server'

import { pipeline } from '@xenova/transformers';
import { convert } from 'html-to-text';
import Groq from 'groq-sdk';
import { EMAIL_CATEGORIES } from './emailProcessing';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
});

// Threshold for multi-label classification confidence
const CONFIDENCE_THRESHOLD = 0.4;

let classifier: any;

async function getClassifier() {
    if (!classifier) {
        classifier = await pipeline('zero-shot-classification', 'Xenova/nli-deberta-v3-xsmall');
    }
    return classifier;
}

export async function categorizeEmail(email: string, multiLabel = true) {
    const classifier = await getClassifier();
    
    // Convert HTML to plain text with proper configuration
    let text: string = email;
    try {
        if (email.includes("<") && email.includes(">")) {
            text = convert(email, {
                selectors: [
                    { selector: 'a', options: { hideLinkHrefIfSameAsText: true, noAnchorUrl: true } },
                    { selector: 'img', options: { format: 'skip' } },
                    { selector: 'style', options: { format: 'skip' } },
                    { selector: 'script', options: { format: 'skip' } },
                    { selector: 'head', options: { format: 'skip' } },
                    { selector: 'hr', options: { format: 'skip' } },
                    { selector: 'br', options: { format: 'linebreak' } }
                ],
                wordwrap: false,
                preserveNewlines: true
            });
        }
    } catch (error) {
        console.error("Error converting HTML:", error);
        // Fallback to original text already set
    }
    
    try {
        // Use Groq for more accurate categorization when API key is available
        if (process.env.GROQ_API_KEY) {
            const prompt = `
            Analyze the following email and categorize it. Choose from these categories: ${EMAIL_CATEGORIES.join(", ")}
            ${multiLabel ? "The email can belong to multiple categories." : "Choose exactly one category."}
            ${multiLabel ? "Return a JSON array with up to 3 most relevant categories." : "Return only the category name."}
            
            EMAIL:
            ${text.substring(0, 3000)}
            `;
            
            const completion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama3-8b-8192",
                temperature: 0.1,
                max_tokens: 100,
            });
            
            const response = completion.choices[0]?.message?.content?.trim() || "";
            
            if (multiLabel) {
                try {
                    // Extract JSON array if present using a safer regex
                    const match = response.match(/\[([\s\S]*?)\]/);
                    if (match) {
                        // Parse the JSON array
                        const categories = JSON.parse(match[0]);
                        return {
                            categories: categories.map((cat: string) => ({
                                category: cat,
                                confidence: 0.9 // Not provided by Groq, using high default
                            })),
                            primaryCategory: categories[0]
                        };
                    }
                } catch (e) {
                    console.error("Error parsing Groq response:", e);
                }
            } else {
                return {
                    sequence: response,
                    labels: [response],
                    scores: [1.0]
                };
            }
        }
    } catch (error) {
        console.error("Error using Groq for categorization:", error);
        // Fall back to transformer model below
    }
    
    // Fallback to transformer model
    const output = await classifier(text, EMAIL_CATEGORIES, {
        multi_label: multiLabel
    });
    
    // For multi-label, filter by confidence threshold
    if (multiLabel) {
        const multiCategories = [];
        
        for (let i = 0; i < output.labels.length; i++) {
            if (output.scores[i] >= CONFIDENCE_THRESHOLD) {
                multiCategories.push({
                    category: output.labels[i],
                    confidence: output.scores[i]
                });
            }
        }
        
        // Sort by confidence
        multiCategories.sort((a, b) => b.confidence - a.confidence);
        
        return {
            categories: multiCategories,
            primaryCategory: multiCategories.length > 0 ? multiCategories[0].category : 'Uncategorized'
        };
    }
    
    return output;
}