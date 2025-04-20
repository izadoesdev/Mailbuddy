"use client";

import { useToast } from "@/once-ui/components";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    clearAIMetadata,
    getAIMetadataStats,
    getAISettings,
    runAIAnalysisOnAllEmails,
    updateAISettings,
} from "./actions";

// Interface for AI Settings
export interface AISettings {
    enabled: boolean;
    customPrompt: string;
    preserveMetadata: boolean;
    priorityKeywords: string[];
    contentAlerts: {
        urgentRequests: boolean;
        financialContent: boolean;
        deadlines: boolean;
        meetings: boolean;
        legalDocuments: boolean;
        personalInfo: boolean;
    };
    analysisPreferences: {
        summarize: boolean;
        categorize: boolean;
        extractActions: boolean;
        detectSentiment: boolean;
        highlightImportant: boolean;
    };
    aiAssistLevel: string;
}

// Interface for metadata stats
export interface MetadataStats {
    totalEmails: number;
    emailsWithMetadata: number;
    topPriorities: { label: string; count: number }[];
    categoryCounts: { [key: string]: number };
    metadataSize: string;
    lastAnalyzedDate: string | null;
}

// Default AI settings
export const DEFAULT_AI_SETTINGS: AISettings = {
    enabled: true,
    customPrompt: "",
    preserveMetadata: true,
    priorityKeywords: [],
    contentAlerts: {
        urgentRequests: true,
        financialContent: true,
        deadlines: true,
        meetings: true,
        legalDocuments: false,
        personalInfo: true,
    },
    analysisPreferences: {
        summarize: true,
        categorize: true,
        extractActions: true,
        detectSentiment: false,
        highlightImportant: true,
    },
    aiAssistLevel: "balanced",
};

// Query keys for cache management
export const queryKeys = {
    aiSettings: (userId: string) => ["ai-settings", userId],
    metadataStats: (userId: string) => ["ai-metadata-stats", userId],
};

/**
 * Hook to fetch and manage AI settings
 */
export function useAISettings(userId: string) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Query to fetch AI settings
    const settingsQuery = useQuery({
        queryKey: queryKeys.aiSettings(userId),
        queryFn: async () => {
            const settings = await getAISettings(userId);
            return settings || DEFAULT_AI_SETTINGS;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Mutation to update AI settings
    const updateSettingsMutation = useMutation({
        mutationFn: async (settings: AISettings) => {
            return await updateAISettings(userId, settings);
        },
        onSuccess: (data) => {
            if (data.success) {
                addToast({
                    variant: "success",
                    message: data.message,
                });
                // Invalidate the settings query to refetch
                queryClient.invalidateQueries({
                    queryKey: queryKeys.aiSettings(userId),
                });
            } else {
                addToast({
                    variant: "danger",
                    message: data.message,
                });
            }
        },
        onError: (error) => {
            console.error("Failed to update AI settings:", error);
            addToast({
                variant: "danger",
                message: "Failed to update AI preferences. Please try again.",
            });
        },
    });

    return {
        settings: settingsQuery.data,
        isLoading: settingsQuery.isLoading,
        isError: settingsQuery.isError,
        error: settingsQuery.error,
        updateSettings: updateSettingsMutation.mutate,
        isUpdating: updateSettingsMutation.isPending,
        refetch: settingsQuery.refetch,
    };
}

/**
 * Hook to fetch and manage AI metadata statistics
 */
export function useAIMetadataStats(userId: string) {
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Query to fetch metadata stats
    const statsQuery = useQuery({
        queryKey: queryKeys.metadataStats(userId),
        queryFn: async () => {
            return await getAIMetadataStats(userId);
        },
        staleTime: 2 * 60 * 1000, // 2 minutes
    });

    // Mutation to clear metadata
    const clearMetadataMutation = useMutation({
        mutationFn: async () => {
            return await clearAIMetadata(userId);
        },
        onSuccess: (data) => {
            if (data.success) {
                addToast({
                    variant: "success",
                    message: data.message,
                });
                // Invalidate the stats query to refetch
                queryClient.invalidateQueries({
                    queryKey: queryKeys.metadataStats(userId),
                });
            } else {
                addToast({
                    variant: "danger",
                    message: data.message,
                });
            }
        },
        onError: (error) => {
            console.error("Failed to clear metadata:", error);
            addToast({
                variant: "danger",
                message: "Failed to clear AI metadata. Please try again.",
            });
        },
    });

    // Mutation to run analysis
    const runAnalysisMutation = useMutation({
        mutationFn: async () => {
            return await runAIAnalysisOnAllEmails(userId);
        },
        onSuccess: (data) => {
            if (data.success) {
                addToast({
                    variant: "success",
                    message: data.message,
                });
                // Invalidate the stats query to refetch after a delay (analysis takes time)
                setTimeout(() => {
                    queryClient.invalidateQueries({
                        queryKey: queryKeys.metadataStats(userId),
                    });
                }, 2000);
            } else {
                addToast({
                    variant: "danger",
                    message: data.message,
                });
            }
        },
        onError: (error) => {
            console.error("Failed to run analysis:", error);
            addToast({
                variant: "danger",
                message: "Failed to run AI analysis. Please try again.",
            });
        },
    });

    return {
        stats: statsQuery.data,
        isLoading: statsQuery.isLoading,
        isError: statsQuery.isError,
        error: statsQuery.error,
        clearMetadata: clearMetadataMutation.mutate,
        isClearing: clearMetadataMutation.isPending,
        runAnalysis: runAnalysisMutation.mutate,
        isAnalyzing: runAnalysisMutation.isPending,
        refetch: statsQuery.refetch,
    };
}
