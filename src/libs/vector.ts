"use server";

import env from "@/libs/env";
import { Index } from "@upstash/vector";

// Initialize the vector index with environment variables
const vectorIndex = new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
});

/**
 * Insert or update vectors in the index
 * @param vectors Array of vector data to insert or update
 * @returns Result of the upsert operation
 */
export async function upsertVectors(
    vectors: Array<{
        id: string;
        vector: number[];
        metadata?: Record<string, unknown>;
    }>,
) {
    try {
        return await vectorIndex.upsert(vectors);
    } catch (error) {
        console.error("Error upserting vectors:", error);
        throw error;
    }
}

/**
 * Query the vector index for similar vectors
 * @param vector The embedding vector to search for
 * @param options Query options (topK, includeMetadata, etc.)
 * @returns Query results
 */
export async function queryVector(
    vector: number[],
    options: {
        topK?: number;
        includeMetadata?: boolean;
        includeVectors?: boolean;
    } = {},
) {
    try {
        const { topK = 10, includeMetadata = true, includeVectors = false } = options;

        // Use the actual API parameters
        return await vectorIndex.query({
            vector,
            topK,
            includeMetadata,
            includeVectors,
        });
    } catch (error) {
        console.error("Error querying vector index:", error);
        throw error;
    }
}

/**
 * Filter vectors by metadata
 * @param filter Metadata filter expression
 * @param options Query options
 * @returns Filtered vectors
 */
export async function filterVectors(
    filter: string,
    options: {
        topK?: number;
        includeMetadata?: boolean;
        includeVectors?: boolean;
    } = {},
) {
    try {
        const { topK = 100, includeMetadata = true, includeVectors = false } = options;

        return await vectorIndex.query({
            data: filter,
            topK,
            includeMetadata,
            includeVectors,
        });
    } catch (error) {
        console.error("Error filtering vectors:", error);
        throw error;
    }
}

/**
 * Delete vectors from the index by their IDs
 * @param ids Array of vector IDs to delete
 * @returns Result of the delete operation
 */
export async function deleteVectors(ids: string[]) {
    try {
        // Pass the array directly as recommended in the docs
        return await vectorIndex.delete(ids);
    } catch (error) {
        console.error("Error deleting vectors:", error);
        throw error;
    }
}

/**
 * Reset the entire vector index (use with caution!)
 * @returns Result of the reset operation
 */
export async function resetVectorIndex() {
    try {
        return await vectorIndex.reset();
    } catch (error) {
        console.error("Error resetting vector index:", error);
        throw error;
    }
}

/**
 * Get vector by ID
 * @param id Vector ID to fetch
 * @returns The vector data or null if not found
 */
export async function getVector(id: string) {
    try {
        return await vectorIndex.fetch([id]);
    } catch (error) {
        console.error(`Error fetching vector with ID ${id}:`, error);
        throw error;
    }
}

/**
 * Check if the vector index is healthy
 * @returns True if the index is healthy
 */
export async function checkVectorHealth() {
    try {
        // A simple operation to check if the index is responsive
        const response = await vectorIndex.info();
        return response !== undefined;
    } catch (error) {
        console.error("Vector index health check failed:", error);
        return false;
    }
}
