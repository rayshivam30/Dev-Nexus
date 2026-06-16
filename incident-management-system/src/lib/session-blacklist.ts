import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import jwt from "jsonwebtoken";

/**
 * Checks if a JWT token is blacklisted in Redis.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  if (!redis) return false;
  try {
    const blacklisted = await redis.get(`jwt:blacklist:${token}`);
    return !!blacklisted;
  } catch (err) {
    logger.error({ err }, "Failed to check token blacklist in Redis");
    return false;
  }
}

/**
 * Decodes the JWT and stores the token in the Redis blacklist
 * for the remaining duration of its validity (TTL).
 */
export async function blacklistToken(token: string): Promise<void> {
  if (!redis) return;
  try {
    const decoded = jwt.decode(token) as { exp?: number } | null;
    if (decoded && decoded.exp) {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const remainingSeconds = decoded.exp - nowSeconds;
      if (remainingSeconds > 0) {
        // Set blacklist key with expiration matching the remaining token lifetime
        await redis.set(`jwt:blacklist:${token}`, "1", { ex: remainingSeconds });
        logger.info({ remainingSeconds }, "JWT token successfully blacklisted");
      }
    }
  } catch (err) {
    logger.error({ err }, "Failed to blacklist JWT token in Redis");
  }
}
