import { useUser } from "@/libs/auth/client";
import { useMutation } from "@tanstack/react-query";
import { useState } from "react";
import type { Email } from "../types";

// Extended Email type with AI search properties
type AISearchEmail = Email & {
    aiScore?: number;
};

export function useAISearch() {
    const [similarEmails, setSimilarEmails] = useState<AISearchEmail[]>([]);
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

            // Use the new API endpoint that handles both vector search and email retrieval
            const response = await fetch("/api/ai-search", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    query,
                    topK: 10,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error(`AI Search Error: ${errorData.error || response.statusText}`);
                throw new Error(errorData.error || "Failed to perform AI search");
            }

            const data = await response.json();

            // Check if data is valid and has the success property
            if (!data || (typeof data.success === "boolean" && !data.success)) {
                console.error(`AI Search Error: ${data?.error || "Unknown error"}`);
                throw new Error(data?.error || "Failed to perform AI search");
            }

            // Ensure emails array exists even if empty
            const emails = data.emails || [];
            const vectorResults = data.vectorResults || [];

            console.log(`AI Search found ${emails.length} matching emails`);

            return {
                ...data,
                emails,
                vectorResults,
            };
        },
        onSuccess: (data) => {
            // Safely check if emails array exists and has items
            const emails = Array.isArray(data.emails) ? data.emails : [];
            const vectorResults = Array.isArray(data.vectorResults) ? data.vectorResults : [];

            if (emails.length === 0) {
                // No emails found, create fallbacks if we have vector results
                if (vectorResults.length > 0) {
                    const fallbackEmails: AISearchEmail[] = vectorResults.map((result: any) => {
                        // Ensure we have a proper Email object with all required fields
                        const email: AISearchEmail = {
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
                                deadlines: {},
                                importantDates: [],
                                hasDeadline: false,
                                nextDeadline: null,
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
                            createdAt: new Date(),
                            aiScore: result.score,
                        };
                        return email;
                    });
                    setSimilarEmails(fallbackEmails);
                } else {
                    // No results at all - set empty array
                    setSimilarEmails([]);
                }
            } else {
                // Use the full email details that already include AI scores
                setSimilarEmails(emails);
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
