import { NextResponse } from "next/server";
import { auth } from "@/libs/auth";
import { headers } from "next/headers";
import { prisma } from "@/libs/db";

/**
 * GET handler to check if a user needs initial sync
 * This is used to determine if we should show the sync UI for first-time users
 */
export async function GET() {
  try {
    // Get user from session
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Check if user has sync state with historyId
    const syncState = await prisma.syncState.findUnique({
      where: { userId },
    });

    // User needs initial sync if:
    // 1. No sync state exists, or
    // 2. Sync state exists but historyId is null (never completed a sync)
    const needsInitialSync = !syncState || !syncState.historyId;

    return NextResponse.json({
      needsInitialSync,
      syncState: syncState ? {
        id: syncState.id,
        historyId: syncState.historyId,
        syncInProgress: syncState.syncInProgress,
        lastSyncTime: syncState.lastSyncTime,
      } : null,
    });
  } catch (error) {
    console.error("Error checking sync status:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to check sync status",
      },
      { status: 500 }
    );
  }
} 