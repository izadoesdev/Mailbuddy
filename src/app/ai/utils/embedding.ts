import { pipeline } from '@xenova/transformers';
import { Index } from "@upstash/vector";
import env from "@/libs/env";

// Initialize the vector database connection
export const vector = new Index({
  url: env.UPSTASH_VECTOR_REST_URL,
  token: env.UPSTASH_VECTOR_REST_TOKEN,
});

// Cache the extractor to avoid reinitializing it for every email
let extractorInstance: any = null;

/**
 * Get or initialize the extractor
 */
async function getExtractor() {
  if (!extractorInstance) {
    // Use all-MiniLM-L6-v2 which produces 384-dimensional embeddings
    extractorInstance = await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2');
  }
  return extractorInstance;
}

/**
 * Resize a vector to the specified target dimension
 * If the vector is too short, it will be padded with zeros
 * If it's too long, it will be truncated
 */
export function resizeVector(vector: number[], targetDimension: number): number[] {
  if (vector.length === targetDimension) {
    return vector;
  }
  
  if (vector.length > targetDimension) {
    // Truncate the vector
    return vector.slice(0, targetDimension);
  }
  
  // Pad the vector with zeros
  const result = [...vector];
  for (let i = vector.length; i < targetDimension; i++) {
    result.push(0);
  }
  return result;
}

// Maximum text length to process (to avoid excessive CPU usage)
const MAX_TEXT_LENGTH = 4000;

/**
 * Process text to a reasonable length for embedding
 */
function preprocessText(text: string): string {
  if (!text) return '';
  
  // Trim and limit text length
  if (text.length > MAX_TEXT_LENGTH) {
    // Keep the first part, which is usually more important
    return text.substring(0, MAX_TEXT_LENGTH);
  }
  
  return text;
}

// Create a function to generate embeddings
export async function generateEmbedding(text: string, targetDimension?: number) {
  try {
    // Preprocess text to a reasonable length
    const processedText = preprocessText(text);
    
    if (!processedText) {
      throw new Error("Empty text after preprocessing");
    }
    
    // Get the extractor instance (cached)
    const extractor = await getExtractor();
    
    // Generate embedding
    const output = await extractor(processedText, { pooling: 'mean', normalize: true });
    
    // Extract the embedding as an array of floats
    const embedding = Array.from(output.data) as number[];
    
    if (!embedding || embedding.length === 0) {
      throw new Error("Failed to generate embedding");
    }
    
    // If a target dimension is provided, resize the vector
    if (targetDimension && targetDimension !== embedding.length) {
      console.log(`Resizing embedding from ${embedding.length} to ${targetDimension} dimensions`);
      return resizeVector(embedding, targetDimension);
    }
    
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
} 