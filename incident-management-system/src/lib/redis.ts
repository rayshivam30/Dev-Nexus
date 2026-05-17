import { Redis } from "@upstash/redis";
import { logger } from "@/lib/logger";

/**
 * Shared Upstash Redis client singleton.
 *
 * Centralizes the Redis connection so every module (rate limiting, caching,
 * event bridge) reuses the same instance instead of creating separate ones.
 * Returns null when credentials are not configured — callers must handle this.
 */

const globalForRedis = globalThis as unknown as { redis: Redis | null };

function createRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    logger.warn("Upstash Redis credentials not set — features requiring Redis will be degraded.");
    return null;
  }

  return new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

export const redis: Redis | null =
  globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== "production" && redis) {
  globalForRedis.redis = redis;
}
