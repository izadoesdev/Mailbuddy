import { redis } from "@/libs/db";

import type { RedisOptions } from "ioredis";
import Redis from "ioredis";
import { SuperJSON } from "superjson";

const getSuperJson = SuperJSON.parse;
const setSuperJson = SuperJSON.stringify;

const options: RedisOptions = {
    connectTimeout: 10000,
    retryStrategy: (times) => {
        const delay = Math.min(times * 100, 3000);
        console.debug(`Redis connection retry attempt ${times}, delay: ${delay}ms`);
        return delay;
    },
    maxRetriesPerRequest: 3,
};

export { Redis };

interface ExtendedRedis extends Redis {
    getJson: <T = any>(key: string) => Promise<T | null>;
    setJson: <T = any>(key: string, expireInSec: number, value: T) => Promise<void>;
}

const createRedisClient = (url: string, overrides: RedisOptions = {}): ExtendedRedis => {
    console.debug(
        `Creating Redis client with URL: ${url.replace(/(redis:\/\/[^:]+:)([^@]+)(@.+)/, "$1****$3")}`,
    );

    const client = new Redis(url, {
        ...options,
        ...overrides,
    }) as ExtendedRedis;

    client.on("error", (error) => {
        console.error("Redis Client Error:", error);
    });

    client.on("connect", () => {
        console.debug("Redis client connected");
    });

    client.on("ready", () => {
        console.debug("Redis client ready");
    });

    client.on("reconnecting", () => {
        console.debug("Redis client reconnecting");
    });

    client.getJson = async <T = any>(key: string): Promise<T | null> => {
        const value = await client.get(key);
        if (value) {
            const res = getSuperJson(value) as T;
            if (res && Array.isArray(res) && res.length === 0) {
                return null;
            }

            if (res && typeof res === "object" && Object.keys(res).length === 0) {
                return null;
            }

            if (res) {
                return res;
            }
        }
        return null;
    };

    client.setJson = async <T = any>(key: string, expireInSec: number, value: T): Promise<void> => {
        await client.setex(key, expireInSec, setSuperJson(value));
    };

    return client;
};

let redisCache: ExtendedRedis;
export function getRedisCache() {
    if (!redisCache) {
        // Access environment variables properly in both Node.js and Cloudflare Workers
        const redisUrl =
            process.env.REDIS_URL ||
            (typeof globalThis.process !== "undefined"
                ? globalThis.process.env?.REDIS_URL
                : null) ||
            (typeof globalThis !== "undefined" && "REDIS_URL" in globalThis
                ? (globalThis as Record<string, any>).REDIS_URL
                : null);

        if (!redisUrl) {
            console.error("REDIS_URL environment variable is not set");
            throw new Error("REDIS_URL environment variable is required");
        }
        redisCache = createRedisClient(redisUrl, options);
    }

    return redisCache;
}

let redisSub: ExtendedRedis;
export function getRedisSub() {
    if (!redisSub) {
        // Access environment variables properly in both Node.js and Cloudflare Workers
        const redisUrl =
            process.env.REDIS_URL ||
            (typeof globalThis.process !== "undefined"
                ? globalThis.process.env?.REDIS_URL
                : null) ||
            (typeof globalThis !== "undefined" && "REDIS_URL" in globalThis
                ? (globalThis as Record<string, any>).REDIS_URL
                : null);

        if (!redisUrl) {
            console.error("REDIS_URL environment variable is not set");
            throw new Error("REDIS_URL environment variable is required");
        }
        redisSub = createRedisClient(redisUrl, options);
    }

    return redisSub;
}

let redisPub: ExtendedRedis;
export async function getRedisPub() {
    if (!redisPub) {
        // Access environment variables properly in both Node.js and Cloudflare Workers
        const redisUrl =
            process.env.REDIS_URL ||
            (typeof globalThis.process !== "undefined"
                ? globalThis.process.env?.REDIS_URL
                : null) ||
            (typeof globalThis !== "undefined" && "REDIS_URL" in globalThis
                ? (globalThis as Record<string, any>).REDIS_URL
                : null);

        if (!redisUrl) {
            console.error("REDIS_URL environment variable is not set");
            throw new Error("REDIS_URL environment variable is required");
        }
        redisPub = createRedisClient(redisUrl, options);
    }

    return redisPub;
}

let redisQueue: ExtendedRedis;
export async function getRedisQueue() {
    if (!redisQueue) {
        // Access environment variables properly in both Node.js and Cloudflare Workers
        const queueRedisUrl =
            process.env.QUEUE_REDIS_URL ||
            (typeof globalThis.process !== "undefined"
                ? globalThis.process.env?.QUEUE_REDIS_URL
                : null) ||
            (typeof globalThis !== "undefined" && "QUEUE_REDIS_URL" in globalThis
                ? (globalThis as Record<string, any>).QUEUE_REDIS_URL
                : null) ||
            process.env.REDIS_URL ||
            (typeof globalThis.process !== "undefined"
                ? globalThis.process.env?.REDIS_URL
                : null) ||
            (typeof globalThis !== "undefined" && "REDIS_URL" in globalThis
                ? (globalThis as Record<string, any>).REDIS_URL
                : null);

        if (!queueRedisUrl) {
            console.error("Neither QUEUE_REDIS_URL nor REDIS_URL environment variable is set");
            throw new Error("Either QUEUE_REDIS_URL or REDIS_URL environment variable is required");
        }

        console.debug("Creating Redis queue client");
        redisQueue = createRedisClient(queueRedisUrl, {
            ...options,
            enableReadyCheck: false,
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
            reconnectOnError: (err) => {
                const targetErrors = ["READONLY", "ETIMEDOUT", "ECONNREFUSED", "ECONNRESET"];
                const shouldReconnect = targetErrors.some((targetError) =>
                    err.message.includes(targetError),
                );

                if (shouldReconnect) {
                    console.log(`Redis error encountered, reconnecting: ${err.message}`);
                    return 1; // Reconnect for specific errors
                }

                console.error(`Redis error encountered, not reconnecting: ${err.message}`);
                return false; // Don't reconnect for other errors
            },
        });
    }

    return redisQueue;
}

export async function getLock(key: string, value: string, timeout: number) {
    const lock = await getRedisCache().set(key, value, "PX", timeout, "NX");
    return lock === "OK";
}

interface CacheOptions {
    expireInSec: number;
    prefix?: string;
    serialize?: (data: unknown) => string;
    deserialize?: (data: string) => unknown;
    staleWhileRevalidate?: boolean;
    staleTime?: number;
    maxRetries?: number;
}

const defaultSerialize = (data: unknown): string => JSON.stringify(data);
const defaultDeserialize = (data: string): unknown =>
    JSON.parse(data, (_, value) => {
        if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.*Z$/.test(value)) {
            return new Date(value);
        }
        return value;
    });

export async function getCache<T>(
    key: string,
    options: CacheOptions | number,
    fn: () => Promise<T>,
): Promise<T> {
    const {
        expireInSec,
        serialize = defaultSerialize,
        deserialize = defaultDeserialize,
        staleWhileRevalidate = false,
        staleTime = 0,
        maxRetries = 3,
    } = typeof options === "number" ? { expireInSec: options } : options;

    let retries = 0;
    while (retries < maxRetries) {
        try {
            const hit = await getRedisCache().get(key);
            if (hit) {
                const data = deserialize(hit) as T;

                if (staleWhileRevalidate) {
                    const ttl = await getRedisCache().ttl(key);
                    if (ttl < staleTime) {
                        // Return stale data and revalidate in background
                        fn()
                            .then(async (freshData) => {
                                if (freshData !== undefined && freshData !== null) {
                                    await getRedisCache().setex(
                                        key,
                                        expireInSec,
                                        serialize(freshData),
                                    );
                                }
                            })
                            .catch((error) => {
                                console.error(
                                    `Background revalidation failed for key ${key}:`,
                                    error,
                                );
                            });
                    }
                }

                return data;
            }

            const data = await fn();
            if (data !== undefined && data !== null) {
                await getRedisCache().setex(key, expireInSec, serialize(data));
            }
            return data;
        } catch (error) {
            retries++;
            if (retries === maxRetries) {
                console.error(`Cache error for key ${key} after ${maxRetries} retries:`, error);
                return fn();
            }
            await new Promise((resolve) => setTimeout(resolve, 100 * retries)); // Exponential backoff
        }
    }

    return fn();
}

export function cacheable<T extends (...args: any) => any>(fn: T, options: CacheOptions | number) {
    const {
        expireInSec,
        prefix = fn.name,
        serialize = defaultSerialize,
        deserialize = defaultDeserialize,
        staleWhileRevalidate = false,
        staleTime = 0,
        maxRetries = 3,
    } = typeof options === "number" ? { expireInSec: options } : options;

    const cachePrefix = `cacheable:${prefix}`;

    function stringify(obj: unknown): string {
        if (obj === null) return "null";
        if (obj === undefined) return "undefined";
        if (typeof obj === "boolean") return obj ? "true" : "false";
        if (typeof obj === "number") return String(obj);
        if (typeof obj === "string") return obj;
        if (typeof obj === "function") return obj.toString();

        if (Array.isArray(obj)) {
            return `[${obj.map(stringify).join(",")}]`;
        }

        if (typeof obj === "object") {
            const pairs = Object.entries(obj)
                .sort(([a], [b]) => a.localeCompare(b))
                .map(([key, value]) => `${key}:${stringify(value)}`);
            return pairs.join(":");
        }

        return String(obj);
    }

    const getKey = (...args: Parameters<T>) => `${cachePrefix}:${stringify(args)}`;

    const cachedFn = async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>>> => {
        const key = getKey(...args);
        let retries = 0;

        while (retries < maxRetries) {
            try {
                const cached = await getRedisCache().get(key);
                if (cached) {
                    const data = deserialize(cached) as Awaited<ReturnType<T>>;

                    if (staleWhileRevalidate) {
                        const ttl = await getRedisCache().ttl(key);
                        if (ttl < staleTime) {
                            // Return stale data and revalidate in background
                            fn(...args)
                                .then(async (freshData: any) => {
                                    if (freshData !== undefined && freshData !== null) {
                                        await getRedisCache().setex(
                                            key,
                                            expireInSec,
                                            serialize(freshData),
                                        );
                                    }
                                })
                                .catch((error: any) => {
                                    console.error(
                                        `Background revalidation failed for function ${fn.name}:`,
                                        error,
                                    );
                                });
                        }
                    }

                    return data;
                }

                const result = await fn(...args);
                if (result !== undefined && result !== null) {
                    await getRedisCache().setex(key, expireInSec, serialize(result));
                }
                return result;
            } catch (error) {
                retries++;
                if (retries === maxRetries) {
                    console.error(
                        `Cache error for function ${fn.name} after ${maxRetries} retries:`,
                        error,
                    );
                    return fn(...args);
                }
                await new Promise((resolve) => setTimeout(resolve, 100 * retries)); // Exponential backoff
            }
        }

        return fn(...args);
    };

    cachedFn.getKey = getKey;
    cachedFn.clear = async (...args: Parameters<T>) => {
        const key = getKey(...args);
        return getRedisCache().del(key);
    };

    cachedFn.clearAll = async () => {
        const keys = await getRedisCache().keys(`${cachePrefix}:*`);
        if (keys.length > 0) {
            return getRedisCache().del(...keys);
        }
    };

    cachedFn.invalidate = async (...args: Parameters<T>) => {
        const key = getKey(...args);
        const result = await fn(...args);
        if (result !== undefined && result !== null) {
            await getRedisCache().setex(key, expireInSec, serialize(result));
        }
        return result;
    };

    return cachedFn;
}
