import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import { searchSimilarEmails } from "@/app/(dev)/ai/new/utils/search";
import type { Email, InboxResponse } from "../types";
import { useUser } from "@/libs/auth/client";

type SimilarEmailResult = {
    id: string;
    score: number;
    metadata?: {
        subject?: string;
        userId?: string;
    };
};

// Helper to ensure a date is properly formatted as a Date object
function ensureDate(date: any): Date {
    if (!date) return new Date();

    if (date instanceof Date) return date;

    if (typeof date === "string") {
        return new Date(date);
    }

    if (typeof date === "number") {
        return new Date(date);
    }

    return new Date();
}

export function useAISearch() {
    const [similarEmails, setSimilarEmails] = useState<Email[]>([]);
    const [isAISearchActive, setIsAISearchActive] = useState(false);
    const { user } = useUser(); // Get the current user to access userId

    // Set up a mutation for handling the AI search
    const aiSearchMutation = useMutation({
        mutationFn: async (query: string) => {
            if (!user?.id) {
                console.error("AI Search Error: User not authenticated");
                throw new Error("User not authenticated");
            }

            console.log(`Performing AI search for user: ${user.id}`);

            // First get the semantic search results
            // Pass user.id as the userId parameter for security filtering
            const searchResponse = await searchSimilarEmails(query, user.id);

            if (!searchResponse || !searchResponse.success) {
                console.error(`AI Search Error: ${searchResponse?.error || "Unknown error"}`);
                throw new Error(searchResponse?.error || "Failed to perform AI search");
            }

            const results = searchResponse.results || [];
            console.log(`AI Search found ${results.length} similar emails`);

            // Extract the IDs of similar emails
            const emailIds = results.map((result) => result.id);

            if (emailIds.length === 0) {
                return { semanticResults: results, fullEmails: [] };
            }

            // Fetch the full email details for each matching ID
            const emailDetailsPromises = emailIds.map(async (id) => {
                // Fetch single email details from the API
                try {
                    // Use the API route that gets a specific email by ID
                    const response = await fetch(`/api/emails/${id}`);
                    if (!response.ok) {
                        console.warn(
                            `Could not fetch details for email ${id}, status: ${response.status}`,
                        );

                        // If the specific email route fails, try the inbox API with filters
                        try {
                            const fallbackResponse = await fetch(`/api/inbox?emailIds=${id}`);
                            if (!fallbackResponse.ok) {
                                return null;
                            }

                            const data = await fallbackResponse.json();
                            if (data && Array.isArray(data.emails) && data.emails.length > 0) {
                                // Get the first matching email
                                return data.emails[0];
                            }
                            return null;
                        } catch (fallbackError) {
                            console.error(`Fallback fetch for email ${id} failed:`, fallbackError);
                            return null;
                        }
                    }

                    const emailData = await response.json();
                    return emailData;
                } catch (error) {
                    console.error(`Error fetching email ${id}:`, error);
                    return null;
                }
            });

            // Wait for all email details to be fetched
            const emailDetails = await Promise.all(emailDetailsPromises);

            // Filter out any null results and combine with the semantic scores
            const fullEmails = emailDetails.filter(Boolean).map((email) => {
                const matchingResult = results.find((r) => r.id === email.id);

                // Process the email to ensure dates are correctly formatted
                const processedEmail = {
                    ...email,
                    // Ensure createdAt is a Date object
                    createdAt: email.internalDate
                        ? new Date(Number.parseInt(email.internalDate))
                        : ensureDate(email.createdAt),
                    labels: [...(email.labels || []), "AI_SEARCH"], // Add AI_SEARCH label
                };

                // Add the AI score as a custom property
                if (matchingResult) {
                    (processedEmail as any).aiScore = matchingResult.score;
                }

                return processedEmail;
            });

            console.log(
                `Successfully retrieved ${fullEmails.length} full emails for AI search results`,
            );
            return { semanticResults: results, fullEmails };
        },
        onSuccess: (data) => {
            if (data.fullEmails.length === 0) {
                // No full email details could be fetched, use the semantic results
                const fallbackEmails: Email[] = data.semanticResults.map((result) => {
                    // Ensure we have a proper Email object with all required fields
                    const email: Email = {
                        id: String(result.id),
                        threadId: String(result.id),
                        subject:
                            typeof result.metadata?.subject === "string"
                                ? result.metadata.subject
                                : "No Subject",
                        from: "AI Search Result",
                        snippet: `Score: ${result.score.toFixed(4)}`,
                        isRead: true,
                        aiMetadata: {
                            id: "AI_SEARCH",
                            createdAt: new Date(),
                            updatedAt: new Date(),
                            emailId: "AI_SEARCH",
                            category: "AI_SEARCH",
                            priority: "AI_SEARCH",
                            categories: [],
                            categoryConfidences: [],
                            sentiment: "AI_SEARCH",
                            importance: "AI_SEARCH",
                            keywords: [],
                            requiresResponse: false,
                            responseTimeframe: "AI_SEARCH",
                            priorityExplanation: "AI_SEARCH",
                            summary: "AI_SEARCH",
                            processingTime: 0,
                            modelUsed: "AI_SEARCH",
                            tokensUsed: 0,
                        },
                        userId: user?.id || "AI_SEARCH",
                        to: "AI_SEARCH",
                        body: "AI_SEARCH",
                        labels: ["AI_SEARCH"],
                        internalDate: new Date().toISOString(),
                        isStarred: false,
                        fetchedAt: new Date(),
                        updatedAt: new Date(),
                        createdAt: new Date(), // Ensure this is a proper Date object
                    };

                    // Store the score in the emails map for display
                    (email as any).aiScore = result.score;
                    return email;
                });

                setSimilarEmails(fallbackEmails);
            } else {
                // Use the full email details
                setSimilarEmails(data.fullEmails);
            }

            setIsAISearchActive(true);
        },
        onError: (error) => {
            console.error("AI search error:", error);
            setSimilarEmails([]);
            setIsAISearchActive(false);
        },
    });

    // Function to perform the AI search
    const performAISearch = (query: string) => {
        if (!query.trim() || !user?.id) {
            console.error("Cannot perform AI search: empty query or no user ID");
            return;
        }
        console.log(`Starting AI search with query: "${query}" for user: ${user.id}`);
        aiSearchMutation.mutate(query);
    };

    // Function to clear AI search results
    const clearAISearch = () => {
        setSimilarEmails([]);
        setIsAISearchActive(false);
    };

    return {
        similarEmails,
        isAISearchActive,
        isAISearchLoading: aiSearchMutation.isPending,
        aiSearchError: aiSearchMutation.error,
        performAISearch,
        clearAISearch,
    };
}
