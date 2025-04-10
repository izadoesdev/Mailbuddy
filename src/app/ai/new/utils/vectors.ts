import index from "../index";
import { cleanEmail, cleanMetadata } from "./clean";
import { EMAIL_CLEANING, VECTOR_CONFIG } from "../constants";
import type { Email } from "@/app/inbox/types";

/**
 * Stores an email in the vector database with security filtering
 */
export async function storeEmail(email: Email) {
    try {
        // Skip if no valid user ID (security measure)
        if (!email.userId || typeof email.userId !== 'string') {
            throw new Error('Invalid userId for vector storage');
        }

        // Clean and prepare the email content
        const content = cleanEmail(email);
        
        // Skip if content is too short to be meaningful
        if (!content || content.length < EMAIL_CLEANING.MIN_CONTENT_LENGTH) {
            throw new Error('Email content too short for meaningful embedding');
        }

        // Prepare metadata with security filtering
        const metadata = cleanMetadata(email);

        // Add retry logic for resilience
        let attempts = 0;
        let success = false;
        let lastError = null;

        while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
            try {
                await index.index.upsert([
                    {
                        id: email.id,
                        data: content,
                        metadata,
                    }
                ]);
                success = true;
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
                    // Wait before retrying
                    await new Promise(resolve => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
                }
            }
        }

        if (!success) {
            throw lastError || new Error('Failed to store email after multiple attempts');
        }

        return { success: true };
    } catch (error) {
        console.error('Error storing email in vector database:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Stores a generic vector with security validation
 */
export async function storeVector(id: string, content: string, metadata: Record<string, any>) {
    try {
        // Security validation
        if (!id || typeof id !== 'string') {
            throw new Error('Invalid vector ID');
        }
        
        if (!content || typeof content !== 'string' || content.length < EMAIL_CLEANING.MIN_CONTENT_LENGTH) {
            throw new Error('Invalid or too short content for vector storage');
        }
        
        // Validate userId in metadata (security measure)
        if (!metadata.userId || typeof metadata.userId !== 'string') {
            throw new Error('Missing or invalid userId in vector metadata');
        }
        
        // Sanitize and limit metadata size
        const sanitizedMetadata: Record<string, any> = {};
        let totalSize = 0;
        
        // Process and validate each metadata field
        for (const [key, value] of Object.entries(metadata)) {
            // Skip null or undefined values
            if (value === null || value === undefined) continue;
            
            // Convert objects to strings with size limits
            const stringValue = typeof value === 'object' 
                ? JSON.stringify(value).substring(0, 100) 
                : String(value);
                
            const fieldSize = key.length + stringValue.length;
            
            // Skip if this field would exceed our size budget
            if (totalSize + fieldSize > EMAIL_CLEANING.MAX_METADATA_SIZE) break;
            
            sanitizedMetadata[key] = value;
            totalSize += fieldSize;
        }

        // Retry logic
        let attempts = 0;
        let success = false;
        let lastError = null;

        while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
            try {
                await index.index.upsert([
                    {
                        id,
                        data: content,
                        metadata: sanitizedMetadata,
                    }
                ]);
                success = true;
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
                    await new Promise(resolve => setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS));
                }
            }
        }

        if (!success) {
            throw lastError || new Error('Failed to store vector after multiple attempts');
        }

        return { success: true };
    } catch (error) {
        console.error('Error in storeVector:', error);
        return { success: false, error: String(error) };
    }
}

/**
 * Query vectors with security filtering by userId
 */
export async function queryVector(query: string, userId: string, options: { topK?: number; includeMetadata?: boolean } = {}) {
    try {
        // Security validation
        if (!query || typeof query !== 'string') {
            throw new Error('Invalid query for vector search');
        }
        
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid userId for vector search');
        }
        
        const { topK = 10, includeMetadata = true } = options;
        
        // Create filter to only search user's documents (critical security measure)
        const filter = { userId: { $eq: userId } };
        
        const results = await index.index.query({
            data: query,
            topK,
            includeMetadata,
            filter: JSON.stringify(filter) // Convert filter to string as required by Upstash
        });

        return { success: true, results };
    } catch (error) {
        console.error('Error in queryVector:', error);
        return { success: false, error: String(error), results: [] };
    }
}

/**
 * Delete vectors with security check
 */
export async function deleteVectors(ids: string[], userId: string) {
    try {
        // Security validation
        if (!Array.isArray(ids) || ids.length === 0) {
            throw new Error('Invalid vector IDs for deletion');
        }
        
        if (!userId || typeof userId !== 'string') {
            throw new Error('Invalid userId for vector deletion');
        }
        
        // First verify these vectors belong to the user (security check)
        const vectors = await index.index.fetch(ids);
        
        // Filter to only delete vectors owned by this user
        const authorizedIds = vectors
            .filter(vector => vector?.metadata?.userId === userId)
            .map(vector => vector?.id)
            .filter((id): id is string => id !== undefined);
            
        if (authorizedIds.length === 0) {
            return { success: true, deletedCount: 0 }; // Nothing to delete
        }
        
        // Delete the authorized vectors
        await index.index.delete(authorizedIds);
        
        return { success: true, deletedCount: authorizedIds.length };
    } catch (error) {
        console.error('Error in deleteVectors:', error);
        return { success: false, error: String(error), deletedCount: 0 };
    }
}

/**
 * Batch store multiple vectors with security validation
 */
export async function batchStoreVectors(vectors: Array<{id: string, content: string, metadata: Record<string, any>}>) {
    try {
        if (!Array.isArray(vectors) || vectors.length === 0) {
            throw new Error('Invalid or empty vectors array');
        }
        
        // Validate and sanitize each vector
        const validVectors = vectors
            .filter(v => v.id && v.content && v.metadata?.userId)
            .map(v => ({
                id: v.id,
                data: v.content,
                metadata: {
                    userId: v.metadata.userId,
                    // Add other sanitized metadata with size limits
                    ...(v.metadata.subject && { subject: String(v.metadata.subject).substring(0, EMAIL_CLEANING.TRUNCATE_SUBJECT) }),
                    ...(v.metadata.createdAt && { createdAt: v.metadata.createdAt }),
                }
            }));
            
        if (validVectors.length === 0) {
            throw new Error('No valid vectors after filtering');
        }
        
        // Process in batches to avoid rate limits
        const batches = [];
        for (let i = 0; i < validVectors.length; i += VECTOR_CONFIG.UPSTASH_BATCH_SIZE) {
            batches.push(validVectors.slice(i, i + VECTOR_CONFIG.UPSTASH_BATCH_SIZE));
        }
        
        let successCount = 0;
        
        // Process each batch
        for (const batch of batches) {
            try {
                await index.index.upsert(batch);
                successCount += batch.length;
            } catch (error) {
                console.error('Error storing batch:', error);
                // Continue with next batch
            }
        }
        
        return { 
            success: successCount > 0, 
            totalCount: vectors.length, 
            successCount 
        };
    } catch (error) {
        console.error('Error in batchStoreVectors:', error);
        return { success: false, error: String(error), totalCount: vectors.length, successCount: 0 };
    }
}
