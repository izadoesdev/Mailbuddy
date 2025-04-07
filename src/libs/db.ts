import { PrismaClient } from "@prisma/client";
import env from "./env";

export * from '@prisma/client';

/**
 * Get a properly configured PrismaClient instance
 */
const getPrismaClient = () => {
  const client = new PrismaClient({
    log: ['error'],
  });
  
  
  return client;
};

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