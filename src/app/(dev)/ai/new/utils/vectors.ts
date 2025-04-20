"use server";

import type { Email } from "@/app/(main)/inbox/types";
import { EMAIL_CLEANING, VECTOR_CONFIG } from "../constants";
import index from "../index";
import { cleanEmail, cleanMetadata } from "./clean";

/**
 * Get a namespace for a user
 * This ensures each user's data is isolated in its own namespace
 */
function getUserNamespace(userId: string): string {
    if (!userId) return ""; // Default namespace is empty string in Upstash
    return `${VECTOR_CONFIG.NAMESPACE_PREFIX}${userId}`;
}

/**
 * Stores an email in the vector database with security filtering
 */
export async function storeEmail(email: Email) {
    try {
        // Skip if no valid user ID (security measure)
        if (!email.userId || typeof email.userId !== "string") {
            throw new Error("Invalid userId for vector storage");
        }

        // Get the user's namespace
        const namespace = getUserNamespace(email.userId);

        // Clean and prepare the email content
        const body = cleanEmail(email);

        const content = `
        Subject: ${email.subject}
        Body: ${body}
        From: ${email.from}
        Date: ${email.internalDate ? new Date(email.internalDate).toLocaleString() : "N/A"}
        `;

        // Skip if content is too short to be meaningful
        if (!content || content.length < EMAIL_CLEANING.MIN_CONTENT_LENGTH) {
            throw new Error("Email content too short for meaningful embedding");
        }

        // Prepare metadata with security filtering
        const metadata = cleanMetadata(email);

        // Add retry logic for resilience
        let attempts = 0;
        let success = false;
        let lastError = null;

        while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
            try {
                // Using namespace parameter for Upstash Vector
                await index.index.upsert(
                    [
                        {
                            id: email.id,
                            data: content,
                            metadata,
                        },
                    ],
                    { namespace }, // Pass as object property
                );
                success = true;
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
                    // Wait before retrying
                    await new Promise((resolve) =>
                        setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS),
                    );
                }
            }
        }

        if (!success) {
            throw lastError || new Error("Failed to store email after multiple attempts");
        }

        return { success: true };
    } catch (error) {
        console.error("Error storing email in vector database:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Stores a generic vector with security validation
 */
export async function storeVector(id: string, content: string, metadata: Record<string, any>) {
    try {
        // Security validation
        if (!id || typeof id !== "string") {
            throw new Error("Invalid vector ID");
        }

        if (
            !content ||
            typeof content !== "string" ||
            content.length < EMAIL_CLEANING.MIN_CONTENT_LENGTH
        ) {
            throw new Error("Invalid or too short content for vector storage");
        }

        // Validate userId in metadata (security measure)
        if (!metadata.userId || typeof metadata.userId !== "string") {
            throw new Error("Missing or invalid userId in vector metadata");
        }

        // Get the user's namespace
        const namespace = getUserNamespace(metadata.userId);

        // Sanitize and limit metadata size
        const sanitizedMetadata: Record<string, any> = {};
        let totalSize = 0;

        // Process and validate each metadata field
        for (const [key, value] of Object.entries(metadata)) {
            // Skip null or undefined values
            if (value === null || value === undefined) continue;

            // Convert objects to strings with size limits
            const stringValue =
                typeof value === "object" ? JSON.stringify(value).substring(0, 100) : String(value);

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
                // Using namespace parameter for Upstash Vector
                await index.index.upsert(
                    [
                        {
                            id,
                            data: content,
                            metadata: sanitizedMetadata,
                        },
                    ],
                    { namespace }, // Pass as object property
                );
                success = true;
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS),
                    );
                }
            }
        }

        if (!success) {
            throw lastError || new Error("Failed to store vector after multiple attempts");
        }

        return { success: true };
    } catch (error) {
        console.error("Error in storeVector:", error);
        return { success: false, error: String(error) };
    }
}

/**
 * Query vectors with security filtering by userId
 */
export async function queryVector(
    query: string,
    userId: string,
    options: { topK?: number; includeMetadata?: boolean } = {},
) {
    try {
        // Security validation
        if (!query || typeof query !== "string") {
            throw new Error("Invalid query for vector search");
        }

        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid userId for vector search");
        }

        const { topK = 10, includeMetadata = true } = options;

        // Get the user's namespace for isolation
        const namespace = getUserNamespace(userId);

        // Perform search with retry logic
        let attempts = 0;
        let success = false;
        let lastError = null;
        let results = null;

        while (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS && !success) {
            try {
                // Query using namespace parameter instead of filter
                results = await index.index.query(
                    {
                        data: query,
                        topK,
                        includeMetadata,
                    },
                    { namespace },
                ); // Pass as object property

                success = true;
            } catch (error) {
                lastError = error;
                attempts++;
                if (attempts < VECTOR_CONFIG.RETRY_ATTEMPTS) {
                    await new Promise((resolve) =>
                        setTimeout(resolve, VECTOR_CONFIG.RETRY_DELAY_MS),
                    );
                }
            }
        }

        if (!success) {
            console.error("Error in queryVector after retries:", lastError);
            return {
                success: false,
                error: String(lastError),
                results: [],
            };
        }

        return { success: true, results: results || [] };
    } catch (error) {
        console.error("Error in queryVector:", error);
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
            throw new Error("Invalid vector IDs for deletion");
        }

        if (!userId || typeof userId !== "string") {
            throw new Error("Invalid userId for vector deletion");
        }

        // Get the user's namespace
        const namespace = getUserNamespace(userId);

        // Delete vectors directly from the user's namespace
        // This is secure because it only affects vectors in this user's namespace
        await index.index.delete({ ids }, { namespace });

        return { success: true, deletedCount: ids.length };
    } catch (error) {
        console.error("Error in deleteVectors:", error);
        return { success: false, error: String(error), deletedCount: 0 };
    }
}

/**
 * Batch store multiple vectors with security validation
 */
export async function batchStoreVectors(
    vectors: Array<{ id: string; content: string; metadata: Record<string, any> }>,
) {
    try {
        if (!Array.isArray(vectors) || vectors.length === 0) {
            throw new Error("Invalid or empty vectors array");
        }

        // Group vectors by user ID to store in correct namespaces
        const vectorsByUser: Record<string, any[]> = {};

        // Validate and group vectors by userId
        for (const v of vectors) {
            // Skip invalid vectors
            if (!v.id || !v.content || !v.metadata?.userId) continue;

            const userId = v.metadata.userId;

            if (!vectorsByUser[userId]) {
                vectorsByUser[userId] = [];
            }

            // Prepare the vector for the group
            vectorsByUser[userId].push({
                id: v.id,
                data: v.content,
                metadata: {
                    userId: v.metadata.userId,
                    // Add other sanitized metadata with size limits
                    ...(v.metadata.subject && {
                        subject: String(v.metadata.subject).substring(
                            0,
                            EMAIL_CLEANING.TRUNCATE_SUBJECT,
                        ),
                    }),
                    ...(v.metadata.createdAt && { createdAt: v.metadata.createdAt }),
                },
            });
        }

        let successCount = 0;
        const errors: string[] = [];

        // Process each user's vectors in batches
        for (const userId in vectorsByUser) {
            const userVectors = vectorsByUser[userId];
            const namespace = getUserNamespace(userId);

            // Process in batches to avoid rate limits
            const batches = [];
            for (let i = 0; i < userVectors.length; i += VECTOR_CONFIG.UPSTASH_BATCH_SIZE) {
                batches.push(userVectors.slice(i, i + VECTOR_CONFIG.UPSTASH_BATCH_SIZE));
            }

            // Process each batch
            for (const batch of batches) {
                try {
                    // Store vectors in the user's namespace
                    await index.index.upsert(batch, { namespace });
                    successCount += batch.length;
                } catch (error) {
                    console.error(`Error storing batch for user ${userId}:`, error);
                    errors.push(`Failed to store batch for user ${userId}: ${String(error)}`);
                    // Continue with next batch
                }
            }
        }

        return {
            success: successCount > 0,
            totalCount: vectors.length,
            successCount,
            errors: errors.length > 0 ? errors : undefined,
        };
    } catch (error) {
        console.error("Error in batchStoreVectors:", error);
        return {
            success: false,
            error: String(error),
            totalCount: vectors.length,
            successCount: 0,
        };
    }
}

/**
 * List all namespaces in the vector database
 * Useful for admin purposes to see all user namespaces
 */
export async function listNamespaces() {
    try {
        const namespaces = await index.index.listNamespaces();
        return {
            success: true,
            namespaces,
        };
    } catch (error) {
        console.error("Error listing namespaces:", error);
        return {
            success: false,
            error: String(error),
            namespaces: [],
        };
    }
}

/**
 * Delete a namespace for a user
 * This will delete ALL vectors for this user - use with caution!
 */
export async function deleteUserNamespace(userId: string) {
    try {
        if (!userId) {
            throw new Error("Invalid user ID for namespace deletion");
        }

        const namespace = getUserNamespace(userId);

        // Don't allow deleting the default namespace
        if (namespace === "") {
            throw new Error("Cannot delete the default namespace");
        }

        await index.index.deleteNamespace(namespace);

        return {
            success: true,
            message: `Successfully deleted namespace for user ${userId}`,
        };
    } catch (error) {
        console.error("Error deleting namespace:", error);
        return {
            success: false,
            error: String(error),
        };
    }
}
