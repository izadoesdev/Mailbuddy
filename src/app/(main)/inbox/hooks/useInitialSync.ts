import { useToast } from "@/once-ui/components";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

interface InitialSyncOptions {
    enabled?: boolean;
    redirectAfterSync?: boolean;
    redirectPath?: string;
}

interface InitialSyncState {
    syncStatus: "idle" | "checking" | "needed" | "in_progress" | "complete" | "error";
    progress: number;
    message: string;
    error: string | null;
    errorType?: string;
}

// Store error state in localStorage to prevent repeated checking
const ERROR_STORAGE_KEY = "sync_error_state";
const ERROR_TIMEOUT = 1000 * 60 * 5; // 5 minutes

export function useInitialSync({
    enabled = true,
    redirectAfterSync = false,
    redirectPath = "/inbox",
}: InitialSyncOptions = {}) {
    // Track if we've already started checking - prevents multiple initial checks
    const hasStartedCheckRef = useRef(false);

    // Check for stored error state on initialization
    const getInitialState = (): InitialSyncState => {
        if (typeof window !== "undefined") {
            try {
                const storedErrorState = localStorage.getItem(ERROR_STORAGE_KEY);
                if (storedErrorState) {
                    const { state, timestamp } = JSON.parse(storedErrorState);
                    // Only use stored state if it's recent enough
                    if (Date.now() - timestamp < ERROR_TIMEOUT) {
                        return state;
                    }
                }
            } catch (e) {
                console.error("Error reading stored sync state:", e);
            }
        }

        return {
            syncStatus: "idle",
            progress: 0,
            message: "Checking sync status...",
            error: null,
        };
    };

    const [syncState, setSyncState] = useState<InitialSyncState>(getInitialState);
    const router = useRouter();
    const queryClient = useQueryClient();
    const { addToast } = useToast();

    // Function to update state and persist errors
    const updateSyncState = useCallback((updater: (prev: InitialSyncState) => InitialSyncState) => {
        setSyncState((prev) => {
            const newState = updater(prev);

            // If this is an error state, store it in localStorage
            if (newState.syncStatus === "error" && typeof window !== "undefined") {
                try {
                    localStorage.setItem(
                        ERROR_STORAGE_KEY,
                        JSON.stringify({
                            state: newState,
                            timestamp: Date.now(),
                        }),
                    );
                } catch (e) {
                    console.error("Error storing sync error state:", e);
                }
            }

            return newState;
        });
    }, []);

    // Function to check if user needs initial sync
    const checkInitialSyncNeeded = useCallback(
        async (forceCheck = false): Promise<boolean> => {
            // Don't recheck if we're already in an error state, unless forceCheck is true
            if (syncState.syncStatus === "error" && !forceCheck) {
                return false;
            }

            try {
                updateSyncState((prev) => ({
                    ...prev,
                    syncStatus: "checking",
                    message: "Checking sync status...",
                }));

                // Build URL with cache-busting parameter if needed
                let url = "/api/sync/status";
                if (forceCheck) {
                    // Add random timestamp to force a fresh request
                    url += `?t=${Date.now()}-${Math.random()}`;
                }

                const response = await fetch(url, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    cache: forceCheck ? "no-store" : undefined,
                });

                if (!response.ok) {
                    throw new Error("Failed to check sync status");
                }

                const data = await response.json();

                // Handle error responses from the API
                if (data.error) {
                    updateSyncState((prev) => ({
                        ...prev,
                        syncStatus: "error",
                        error: data.error,
                        errorType: data.errorType || "unknown_error",
                    }));

                    // Show appropriate toast based on error type
                    if (data.errorType === "no_gmail_account") {
                        addToast({
                            variant: "danger",
                            message:
                                "No Gmail account connected. Please connect your Gmail account in settings.",
                        });
                    } else if (data.errorType === "invalid_credentials") {
                        addToast({
                            variant: "danger",
                            message:
                                "Gmail account needs to be reconnected. Please update your account in settings.",
                        });
                    }

                    return false;
                }

                return data.needsInitialSync;
            } catch (error) {
                console.error("Error checking initial sync status:", error);
                updateSyncState((prev) => ({
                    ...prev,
                    syncStatus: "error",
                    error: error instanceof Error ? error.message : "Failed to check sync status",
                    errorType: "connection_error",
                }));
                return false;
            }
        },
        [syncState.syncStatus, updateSyncState, addToast],
    );

    // Function to perform initial sync
    const performInitialSync = useCallback(async () => {
        // Clear any previous error state
        if (typeof window !== "undefined") {
            localStorage.removeItem(ERROR_STORAGE_KEY);
        }

        try {
            updateSyncState((prev) => ({
                ...prev,
                syncStatus: "in_progress",
                progress: 0,
                message: "Starting initial sync...",
            }));

            // Set up event source for progress updates
            const response = await fetch("/api/sync/messages", {
                method: "POST",
            });

            if (!response.ok) {
                throw new Error("Failed to start sync");
            }

            const data = await response.json();

            switch (data.type) {
                case "init":
                    updateSyncState((prev) => ({
                        ...prev,
                        message: "Initializing sync...",
                    }));
                    break;

                case "count":
                    updateSyncState((prev) => ({
                        ...prev,
                        message: `Found ${data.totalMessages} messages to sync`,
                    }));
                    break;

                case "progress": {
                    const progress = data.progress || 0;
                    updateSyncState((prev) => ({
                        ...prev,
                        progress,
                        message: `Syncing messages... ${progress}% complete`,
                    }));
                    break;
                }

                case "complete":
                    updateSyncState((prev) => ({
                        ...prev,
                        syncStatus: "complete",
                        progress: 100,
                        message: "Sync completed successfully!",
                    }));

                    // Invalidate queries to refresh data
                    queryClient.invalidateQueries({ queryKey: ["emails"] });

                    // Clear any error state from storage
                    if (typeof window !== "undefined") {
                        localStorage.removeItem(ERROR_STORAGE_KEY);
                    }

                    // Add success toast
                    addToast({
                        variant: "success",
                        message: `Email sync completed successfully!${data.newMessageCount ? ` ${data.newMessageCount} new messages found.` : ""}`,
                    });

                    // Redirect if needed
                    if (redirectAfterSync) {
                        router.push(redirectPath);
                    }
                    break;

                case "error":
                    updateSyncState((prev) => ({
                        ...prev,
                        syncStatus: "error",
                        error: data.message || "An error occurred during sync",
                    }));

                    //  Add error toast
                    addToast({
                        variant: "danger",
                        message: data.message || "Failed to sync emails",
                    });
                    break;
            }
        } catch (parseError) {
            console.error("Error parsing event data:", parseError);
        }
    }, [updateSyncState, queryClient, addToast, router, redirectAfterSync, redirectPath]);

    // Handle error reset button click
    const resetSyncError = useCallback(() => {
        // Clear stored error state
        if (typeof window !== "undefined") {
            localStorage.removeItem(ERROR_STORAGE_KEY);
        }

        // Reset the hasStartedCheckRef to allow checking again
        hasStartedCheckRef.current = false;

        // Reset sync state to idle
        updateSyncState(() => ({
            syncStatus: "idle",
            progress: 0,
            message: "Checking sync status...",
            error: null,
        }));

        // Re-check sync status after a brief delay with forceCheck=true to bypass the error state check
        setTimeout(() => {
            checkInitialSyncNeeded(true).then((needsSync) => {
                if (needsSync) {
                    performInitialSync();
                }
            });
        }, 500);
    }, [checkInitialSyncNeeded, updateSyncState, performInitialSync]);

    // Check if sync is needed on mount, but skip if we already have an error state
    useEffect(() => {
        if (!enabled || syncState.syncStatus === "error" || hasStartedCheckRef.current) return;

        // Mark that we've started the check
        hasStartedCheckRef.current = true;

        let isMounted = true;

        const checkAndSync = async () => {
            try {
                const needsSync = await checkInitialSyncNeeded();

                if (!isMounted) return;

                if (needsSync) {
                    updateSyncState((prev) => ({
                        ...prev,
                        syncStatus: "needed",
                        message: "Initial sync needed",
                    }));

                    // Start sync automatically
                    await performInitialSync();
                } else if (syncState.syncStatus !== "error") {
                    // Only update if we're not in an error state
                    updateSyncState((prev) => ({
                        ...prev,
                        syncStatus: "complete",
                        progress: 100,
                        message: "Sync already completed",
                    }));
                }
            } catch (error) {
                if (!isMounted) return;

                console.error("Error in checkAndSync:", error);
                updateSyncState((prev) => ({
                    ...prev,
                    syncStatus: "error",
                    error: error instanceof Error ? error.message : "Failed to check sync status",
                }));
            }
        };

        checkAndSync();

        return () => {
            isMounted = false;
        };
    }, [
        enabled,
        checkInitialSyncNeeded,
        performInitialSync,
        syncState.syncStatus,
        updateSyncState,
    ]);

    return {
        ...syncState,
        isInitialSyncNeeded: syncState.syncStatus === "needed",
        isInitialSyncInProgress: syncState.syncStatus === "in_progress",
        isInitialSyncComplete: syncState.syncStatus === "complete",
        isInitialSyncError: syncState.syncStatus === "error",
        errorType: syncState.errorType,
        performInitialSync,
        resetSyncError,
    };
}
