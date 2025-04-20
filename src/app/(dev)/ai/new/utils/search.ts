"use server";

import type { Email } from "@/app/(main)/inbox/types";
import { VECTOR_CONFIG } from "../constants";
import index from "../index";
import { cleanEmail } from "./clean";
import { queryVector } from "./vectors";

// Define the search result type for better type safety
export type SearchResult = {
    id: string;
    score: number;
    metadata?: Record<string, any>;
};

export interface SearchResponse {
    success: boolean;
    error?: string;
    results: SearchResult[];
}

/**
 * Search for similar emails using vector similarity
 */
export async function searchSimilarEmails(
    emailOrContent: Email | string,
    userId?: string,
    options: { topK?: number } = {},
): Promise<SearchResponse> {
    try {
        const { topK = 10 } = options;

        // Handle different input types
        let content: string;
        let userIdentifier: string | undefined;

        if (typeof emailOrContent === "string") {
            // Direct text content provided
            content = emailOrContent;
            userIdentifier = userId;
        } else {
            // Email object provided
            content = cleanEmail(emailOrContent);
            userIdentifier = emailOrContent.userId;
        }

        // Validate content
        if (!content) {
            return {
                success: false,
                error: "Content too short for meaningful search",
                results: [],
            };
        }

        // Security validation - must have valid userId
        if (!userIdentifier || typeof userIdentifier !== "string") {
            return {
                success: false,
                error: "Invalid user ID for security filtering",
                results: [],
            };
        }

        console.log(
            `Searching vectors for user ${userIdentifier} with namespace ${VECTOR_CONFIG.NAMESPACE_PREFIX}${userIdentifier}`,
        );

        // Use the existing queryVector function which already handles namespacing
        const queryResults = await queryVector(content, userIdentifier, {
            topK,
            includeMetadata: true,
        });

        if (!queryResults.success) {
            return {
                success: false,
                error: queryResults.error || "Vector search failed",
                results: [],
            };
        }

        // Process and clean up the results
        const formattedResults: SearchResult[] = Array.isArray(queryResults.results)
            ? queryResults.results.map((match: any) => ({
                  id: String(match.id || ""),
                  score: typeof match.score === "number" ? match.score : 0,
                  metadata: match.metadata || {},
              }))
            : [];

        console.log(`Search found ${formattedResults.length} results for user ${userIdentifier}`);

        return {
            success: true,
            results: formattedResults,
        };
    } catch (error) {
        console.error("Error in searchSimilarEmails:", error);
        return {
            success: false,
            error: String(error),
            results: [],
        };
    }
}

/**
 * Search for emails by text query
 */
export async function searchEmailsByQuery(
    query: string,
    userId: string,
    options: { topK?: number } = {},
): Promise<SearchResponse> {
    try {
        // Validate userId (required for security)
        if (!userId || typeof userId !== "string") {
            return {
                success: false,
                error: "Invalid user ID for security filtering",
                results: [],
            };
        }

        // For text queries, use the more general search function with explicit userId
        return searchSimilarEmails(query, userId, options);
    } catch (error) {
        console.error("Error in searchEmailsByQuery:", error);
        return {
            success: false,
            error: String(error),
            results: [],
        };
    }
}
