import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";
import jwt from "jsonwebtoken";

/**
 * In-memory fallback blacklist for when Redis is unavailable.
 * Entries are stored with their expiry timestamp so we can prune them.
 */
const localBlacklist = new Map<string, number>(); // token -> expiry epoch ms

function pruneLocalBlacklist() {
  const now = Date.now();
  for (const [token, expiry] of localBlacklist) {
    if (now > expiry) localBlacklist.delete(token);
  }
}

/**
 * Checks if a JWT token is blacklisted.
 * - Tries Redis first.
 * - Falls back to the in-memory blacklist when Redis is unavailable.
 * - FAIL-CLOSED: if Redis is configured but unreachable, returns true (deny)
 *   to prevent logged-out tokens from being reused.
 */
export async function isTokenBlacklisted(token: string): Promise<boolean> {
  // Always check local cache first (covers Redis-down scenario)
  pruneLocalBlacklist();
  if (localBlacklist.has(token)) return true;

  if (!redis) {
    // No Redis configured at all — only local map is available
    return false;
  }

  try {
    const blacklisted = await redis.get(`jwt:blacklist:${token}`);
    return !!blacklisted;
  } catch (err) {
    logger.error({ err }, "Redis unavailable during blacklist check — failing closed");
    // Fail-closed: treat token as blacklisted to protect security
    return true;
  }
}

/**
 * Decodes the JWT and stores the token in the Redis blacklist (and local map)
 * for the remaining duration of its validity (TTL).
 */
export async function blacklistToken(token: string): Promise<void> {
  const decoded = jwt.decode(token) as { exp?: number } | null;
  const nowSeconds = Math.floor(Date.now() / 1000);
  const remainingSeconds = decoded?.exp ? decoded.exp - nowSeconds : 0;

  if (remainingSeconds <= 0) return; // Token already expired, nothing to blacklist

  // Always store in local fallback map
  pruneLocalBlacklist();
  localBlacklist.set(token, Date.now() + remainingSeconds * 1000);

  if (!redis) return;

  try {
    await redis.set(`jwt:blacklist:${token}`, "1", { ex: remainingSeconds });
    logger.info({ remainingSeconds }, "JWT token blacklisted in Redis");
  } catch (err) {
    logger.error({ err }, "Failed to blacklist JWT token in Redis — local map used as fallback");
  }
}
