import { redis } from "@/lib/redis";
import { logger } from "@/lib/logger";

interface LockoutConfig {
  maxAttempts: number;
  lockoutDurationMs: number;
  windowMs: number;
}

const DEFAULT_CONFIG: LockoutConfig = {
  maxAttempts: 5,
  lockoutDurationMs: 15 * 60 * 1000,  // 15 minutes
  windowMs: 60 * 1000,  // 1 minute window
};

// In-memory fallback stores
const inMemoryAttempts = new Map<string, { count: number; resetAt: number }>();
const inMemoryLockouts = new Map<string, number>(); // key -> lockedUntil timestamp

/**
 * Generic attempt checker supporting Redis and In-Memory fallbacks.
 */
export async function checkGenericAttempts(
  keyIdentifier: string,
  prefix: string,
  config: LockoutConfig = DEFAULT_CONFIG
): Promise<{ allowed: boolean; attemptsLeft: number; lockedUntil?: Date }> {
  const key = `${prefix}:attempts:${keyIdentifier}`;
  const lockKey = `${prefix}:locked:${keyIdentifier}`;
  const now = Date.now();

  if (redis) {
    try {
      // Check if locked
      const locked = await redis.get(lockKey);
      if (locked) {
        const lockExpiry = await redis.pttl(lockKey);
        return {
          allowed: false,
          attemptsLeft: 0,
          lockedUntil: new Date(now + (lockExpiry > 0 ? lockExpiry : config.lockoutDurationMs))
        };
      }

      // Check attempts
      const attempts = await redis.incr(key);
      if (attempts === 1) {
        await redis.pexpire(key, config.windowMs);
      }

      if (attempts > config.maxAttempts) {
        // Lock account/resource
        await redis.psetex(lockKey, config.lockoutDurationMs, '1');
        await redis.del(key);

        logger.warn({ keyIdentifier, prefix, attempts }, `${prefix} lockout triggered`);

        return {
          allowed: false,
          attemptsLeft: 0,
          lockedUntil: new Date(now + config.lockoutDurationMs)
        };
      }

      return {
        allowed: true,
        attemptsLeft: Math.max(0, config.maxAttempts - attempts)
      };
    } catch (e) {
      logger.error({ err: e }, `Redis rate check error for prefix ${prefix}, falling back to memory`);
    }
  }

  // In-memory fallback (useful for tests & local dev when Redis is down/not configured)
  // Clean up stale in-memory lockouts
  const lockedUntil = inMemoryLockouts.get(key);
  if (lockedUntil) {
    if (now < lockedUntil) {
      return {
        allowed: false,
        attemptsLeft: 0,
        lockedUntil: new Date(lockedUntil)
      };
    } else {
      inMemoryLockouts.delete(key);
    }
  }

  let entry = inMemoryAttempts.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + config.windowMs };
    inMemoryAttempts.set(key, entry);
  } else {
    entry.count += 1;
  }

  if (entry.count > config.maxAttempts) {
    const lockTime = now + config.lockoutDurationMs;
    inMemoryLockouts.set(key, lockTime);
    inMemoryAttempts.delete(key);

    logger.warn({ keyIdentifier, prefix, attempts: entry.count }, `${prefix} lockout triggered (in-memory)`);

    return {
      allowed: false,
      attemptsLeft: 0,
      lockedUntil: new Date(lockTime)
    };
  }

  return {
    allowed: true,
    attemptsLeft: config.maxAttempts - entry.count
  };
}

/**
 * Clear lockout/attempts.
 */
export async function clearGenericAttempts(keyIdentifier: string, prefix: string) {
  const key = `${prefix}:attempts:${keyIdentifier}`;
  const lockKey = `${prefix}:locked:${keyIdentifier}`;

  inMemoryAttempts.delete(key);
  inMemoryLockouts.delete(key);

  if (redis) {
    try {
      await redis.del(key);
      await redis.del(lockKey);
    } catch (e) {
      logger.error({ err: e }, `Failed to clear attempts in Redis for prefix ${prefix}`);
    }
  }
}

// ── Specific Rate Limiters ───────────────────────────────────────────────────

export async function checkLoginAttempts(
  email: string,
  config: LockoutConfig = DEFAULT_CONFIG
) {
  return checkGenericAttempts(email, "login", config);
}

export async function recordLoginSuccess(email: string) {
  return clearGenericAttempts(email, "login");
}

export async function checkInviteAcceptAttempts(
  emailOrIp: string,
  config: LockoutConfig = DEFAULT_CONFIG
) {
  return checkGenericAttempts(emailOrIp, "invite", config);
}

export async function recordInviteAcceptSuccess(emailOrIp: string) {
  return clearGenericAttempts(emailOrIp, "invite");
}
