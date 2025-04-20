import { auth } from "@/libs/auth";
import { prisma } from "@/libs/db";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

// Cache response for 10 seconds to prevent repeated calls
const CACHE_MAX_AGE = 10; // seconds

/**
 * GET handler to check if a user needs initial sync
 * This is used to determine if we should show the sync UI for first-time users
 */
export async function GET() {
    try {
        // Get user from session
        const session = await auth.api.getSession({ headers: await headers() });
        if (!session?.user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                {
                    status: 401,
                    headers: {
                        "Cache-Control": "no-store",
                    },
                },
            );
        }

        const userId = session.user.id;

        // Check if user has a connected Google account
        const googleAccount = await prisma.account.findFirst({
            where: {
                userId,
                providerId: "google",
            },
        });

        if (!googleAccount) {
            return NextResponse.json(
                {
                    needsInitialSync: false,
                    error: "No Gmail account connected",
                    errorType: "no_gmail_account",
                    syncState: null,
                },
                {
                    headers: {
                        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
                    },
                },
            );
        }

        // Check if the Google account has valid credentials
        // if (!googleAccount.accessToken) {
        //   return NextResponse.json({
        //     needsInitialSync: false,
        //     error: "Gmail account missing valid credentials",
        //     errorType: "invalid_credentials",
        //     syncState: null,
        //   }, {
        //     headers: {
        //       'Cache-Control': `public, max-age=${CACHE_MAX_AGE}`
        //     }
        //   });
        // }

        // Check if user has sync state with historyId
        const syncState = await prisma.syncState.findUnique({
            where: { userId },
        });

        // User needs initial sync if:
        // 1. No sync state exists, or
        // 2. Sync state exists but historyId is null (never completed a sync)
        const needsInitialSync = !syncState || !syncState.historyId;

        return NextResponse.json(
            {
                needsInitialSync,
                syncState: syncState
                    ? {
                          id: syncState.id,
                          historyId: syncState.historyId,
                          syncInProgress: syncState.syncInProgress,
                          lastSyncTime: syncState.lastSyncTime,
                      }
                    : null,
            },
            {
                headers: {
                    "Cache-Control": `public, max-age=${CACHE_MAX_AGE}`,
                },
            },
        );
    } catch (error) {
        console.error("Error checking sync status:", error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Failed to check sync status",
                errorType: "server_error",
            },
            {
                status: 500,
                headers: {
                    "Cache-Control": "no-store",
                },
            },
        );
    }
}
