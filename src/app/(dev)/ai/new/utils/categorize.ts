// "use server";

// import { pipeline } from "@xenova/transformers";
// import { EMAIL_CATEGORIES } from "../constants";
// import { cleanEmail } from "./clean";
// import type { Email } from "@/app/(main)/inbox/types";
// import index from "../index";

// // Threshold for multi-label classification confidence
// const CONFIDENCE_THRESHOLD = 0.4;

// let classifier: any;

// /**
//  * Get or initialize the zero-shot classifier
//  */
// async function getClassifier() {
//     if (!classifier) {
//         classifier = await pipeline("zero-shot-classification", "Xenova/nli-deberta-v3-xsmall");
//     }
//     return classifier;
// }

// /**
//  * Categorize an email using either Groq LLM (preferred) or transformer model
//  */
// export async function categorizeEmail(email: Email, multiLabel = true) {
//     try {
//         // Clean email content
//         const text = cleanEmail(email) || "";

//         // Try using Groq for more accurate categorization when API key is available
//         const groqResult = await tryGroqCategorization(text, multiLabel);
//         if (groqResult) return groqResult;

//         // Fallback to transformer model
//         return await transformerCategorization(text, multiLabel);
//     } catch (error) {
//         console.error("Error in categorizeEmail:", error);
//         // Return default result
//         return multiLabel
//             ? { categories: [], primaryCategory: "Uncategorized" }
//             : { sequence: "Uncategorized", labels: ["Uncategorized"], scores: [1.0] };
//     }
// }

// /**
//  * Attempt to categorize using Groq LLM
//  */
// async function tryGroqCategorization(text: string, multiLabel: boolean) {
//     if (!process.env.GROQ_API_KEY) return null;

//     try {
//         const prompt = `
//         Analyze the following email and categorize it. Choose from these categories: ${EMAIL_CATEGORIES.join(", ")}
//         ${multiLabel ? "The email can belong to multiple categories." : "Choose exactly one category."}
//         ${multiLabel ? "Return a JSON array with up to 3 most relevant categories." : "Return only the category name."}

//         EMAIL:
//         ${text.substring(0, 3000)}
//         `;

//         const completion = await index.groq.chat.completions.create({
//             messages: [{ role: "user", content: prompt }],
//             model: "llama3-8b-8192",
//             temperature: 0.1,
//             max_tokens: 100,
//         });

//         const response = completion.choices[0]?.message?.content?.trim() || "";

//         if (multiLabel) {
//             try {
//                 // Extract JSON array if present using a safer regex
//                 const match = response.match(/\[([\s\S]*?)\]/);
//                 if (match) {
//                     // Parse the JSON array
//                     const categories = JSON.parse(match[0]);
//                     return {
//                         categories: categories.map((cat: string) => ({
//                             category: cat,
//                             confidence: 0.9, // Not provided by Groq, using high default
//                         })),
//                         primaryCategory: categories[0],
//                     };
//                 }
//             } catch (e) {
//                 console.error("Error parsing Groq response:", e);
//             }
//         } else {
//             return {
//                 sequence: response,
//                 labels: [response],
//                 scores: [1.0],
//             };
//         }
//     } catch (error) {
//         console.error("Error using Groq for categorization:", error);
//     }

//     return null;
// }

// /**
//  * Categorize using transformer model
//  */
// async function transformerCategorization(text: string, multiLabel: boolean) {
//     try {
//         const classifier = await getClassifier();

//         const output = await classifier(text, EMAIL_CATEGORIES, {
//             multi_label: multiLabel,
//         });

//         // For multi-label, filter by confidence threshold
//         if (multiLabel) {
//             const multiCategories = [];

//             for (let i = 0; i < output.labels.length; i++) {
//                 if (output.scores[i] >= CONFIDENCE_THRESHOLD) {
//                     multiCategories.push({
//                         category: output.labels[i],
//                         confidence: output.scores[i],
//                     });
//                 }
//             }

//             // Sort by confidence
//             multiCategories.sort((a, b) => b.confidence - a.confidence);

//             return {
//                 categories: multiCategories,
//                 primaryCategory:
//                     multiCategories.length > 0 ? multiCategories[0].category : "Uncategorized",
//             };
//         }

//         return output;
//     } catch (error) {
//         console.error("Error in transformer categorization:", error);
//         throw error; // Propagate to main function
//     }
// }
