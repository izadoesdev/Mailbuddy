import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/once-ui/components";

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
}

export function useInitialSync({
  enabled = true,
  redirectAfterSync = false,
  redirectPath = "/inbox",
}: InitialSyncOptions = {}) {
  const [syncState, setSyncState] = useState<InitialSyncState>({
    syncStatus: "idle",
    progress: 0,
    message: "Checking sync status...",
    error: null,
  });
  const router = useRouter();
  const queryClient = useQueryClient();
  const { addToast } = useToast();

  // Function to check if user needs initial sync
  const checkInitialSyncNeeded = useCallback(async (): Promise<boolean> => {
    try {
      setSyncState((prev) => ({ ...prev, syncStatus: "checking", message: "Checking sync status..." }));
      
      const response = await fetch("/api/sync/status", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to check sync status");
      }

      const data = await response.json();
      return data.needsInitialSync;
    } catch (error) {
      console.error("Error checking initial sync status:", error);
      setSyncState((prev) => ({
        ...prev,
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Failed to check sync status",
      }));
      return false;
    }
  }, []);

  // Function to perform initial sync
  const performInitialSync = useCallback(async () => {
    try {
      setSyncState((prev) => ({
        ...prev,
        syncStatus: "in_progress",
        progress: 0,
        message: "Starting initial sync...",
      }));

      // Set up event source for progress updates
      const eventSource = new EventSource("/api/sync/messages");
      
      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          switch (data.type) {
            case "init":
              setSyncState((prev) => ({
                ...prev,
                message: "Initializing sync...",
              }));
              break;
              
            case "count":
              setSyncState((prev) => ({
                ...prev,
                message: `Found ${data.totalMessages} messages to sync`,
              }));
              break;
              
            case "progress": {
              const progress = data.progress || 0;
              setSyncState((prev) => ({
                ...prev,
                progress,
                message: `Syncing messages... ${progress}% complete`,
              }));
              break;
            }
              
            case "complete":
              setSyncState((prev) => ({
                ...prev,
                syncStatus: "complete",
                progress: 100,
                message: "Sync completed successfully!",
              }));
              
              // Invalidate queries to refresh data
              queryClient.invalidateQueries({ queryKey: ["emails"] });
              
              // Close the event source
              eventSource.close();
              
              // Add success toast
              addToast({
                variant: "success",
                message: `Email sync completed successfully!${data.newMessageCount ? ` ${data.newMessageCount} new messages found.` : ''}`,
              });
              
              // Redirect if needed
              if (redirectAfterSync) {
                router.push(redirectPath);
              }
              break;
              
            case "error":
              setSyncState((prev) => ({
                ...prev,
                syncStatus: "error",
                error: data.message || "An error occurred during sync",
              }));
              
              // Close the event source
              eventSource.close();
              
              // Add error toast
              addToast({
                variant: "danger",
                message: data.message || "Failed to sync emails",
              });
              break;
          }
        } catch (parseError) {
          console.error("Error parsing event data:", parseError);
        }
      };
      
      eventSource.onerror = () => {
        setSyncState((prev) => ({
          ...prev,
          syncStatus: "error",
          error: "Connection to sync service was lost",
        }));
        
        eventSource.close();
        
        addToast({
          variant: "danger",
          message: "Connection to sync service was lost",
        });
      };
      
      // Return cleanup function
      return () => {
        eventSource.close();
      };
      
    } catch (error) {
      setSyncState((prev) => ({
        ...prev,
        syncStatus: "error",
        error: error instanceof Error ? error.message : "Failed to start sync",
      }));
      
      addToast({
        variant: "danger",
        message: error instanceof Error ? error.message : "Failed to start sync",
      });
    }
  }, [addToast, queryClient, redirectAfterSync, redirectPath, router]);

  // Check if sync is needed on mount
  useEffect(() => {
    if (!enabled) return;
    
    let isMounted = true;
    
    const checkAndSync = async () => {
      try {
        const needsSync = await checkInitialSyncNeeded();
        
        if (!isMounted) return;
        
        if (needsSync) {
          setSyncState((prev) => ({
            ...prev,
            syncStatus: "needed",
            message: "Initial sync needed",
          }));
          
          // Start sync automatically
          await performInitialSync();
        } else {
          setSyncState((prev) => ({
            ...prev,
            syncStatus: "complete",
            progress: 100,
            message: "Sync already completed",
          }));
        }
      } catch (error) {
        if (!isMounted) return;
        
        console.error("Error in checkAndSync:", error);
        setSyncState((prev) => ({
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
  }, [enabled, checkInitialSyncNeeded, performInitialSync]);

  return {
    ...syncState,
    isInitialSyncNeeded: syncState.syncStatus === "needed",
    isInitialSyncInProgress: syncState.syncStatus === "in_progress",
    isInitialSyncComplete: syncState.syncStatus === "complete",
    isInitialSyncError: syncState.syncStatus === "error",
    performInitialSync,
  };
} 