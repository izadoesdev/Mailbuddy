import { PrismaClient } from "@prisma/client";
import { Redis } from "ioredis";
import env from "./env";

export * from "@prisma/client";

/**
 * Get a properly configured PrismaClient instance
 */
const getPrismaClient = () => {
    const client = new PrismaClient({
        log: ["error", "warn"],
        datasources: {
            db: {
                url: env.DATABASE_URL,
            },
        },
    }).$extends({
        query: {
            $allModels: {
                async $allOperations({ args, query, operation }) {
                    const startTime = Date.now();
                    const result = await query(args);
                    const duration = Date.now() - startTime;
                    if (duration > 100) {
                        console.log(`Slow query (${duration}ms): ${operation}`);
                    }
                    return result;
                },
            },
        },
    });

    return client;
};

// Upstash Redis client for caching and sync state management
export const redis = new Redis(process.env.REDIS_URL || "");

// Add prisma to the global type
const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient;
};

// Export a singleton instance of PrismaClient
export const prisma = globalForPrisma.prisma ?? getPrismaClient();

// Prevent multiple instances during development due to HMR
if (env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}
