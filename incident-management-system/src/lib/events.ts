import { EventEmitter } from 'events';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

// ── In-process EventEmitter (instant, same-instance delivery) ────────────────
const globalForEmitter = globalThis as unknown as { eventEmitter: EventEmitter };

export const eventEmitter = globalForEmitter.eventEmitter || new EventEmitter();

// Allow up to 150 concurrent listeners (100 SSE clients + buffer).
eventEmitter.setMaxListeners(150);

if (process.env.NODE_ENV !== 'production') globalForEmitter.eventEmitter = eventEmitter;

export const EVENTS = {
  INCIDENT_CREATED: 'incident:created',
  INCIDENT_UPDATED: 'incident:updated',
  INCIDENT_ASSIGNED: 'incident:assigned',
  COMMENT_ADDED: 'incident:comment_added',
  SLA_BREACHED: 'incident:sla_breach',
};

// ── Redis Event Bridge ───────────────────────────────────────────────────────
// Stores events in Redis sorted sets (score = timestamp) so that:
//   1. Other server instances can read them (multi-instance support).
//   2. SSE clients that reconnect can catch up on missed events.
//   3. Events auto-expire after EVENT_TTL_SECONDS.
// This is a lightweight alternative to Redis Pub/Sub which requires persistent
// connections (not supported by Upstash REST).

const EVENT_TTL_SECONDS = 120; // events expire after 2 minutes
const EVENT_MAX_ENTRIES = 200; // keep last 200 events per org

interface StoredEvent {
  id: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: number;
}

/**
 * Emit an event both locally (EventEmitter) and to Redis (for cross-instance).
 * Falls back to local-only when Redis is unavailable.
 */
export async function emitEvent(event: string, data: Record<string, unknown> & { orgId: string }) {
  // 1. Always emit locally for instant same-instance delivery
  eventEmitter.emit(event, data);

  // 2. Persist to Redis for cross-instance + reconnection catch-up
  if (!redis) return;

  const orgId = data.orgId;
  const redisKey = `events:${orgId}`;
  const timestamp = Date.now();

  const storedEvent: StoredEvent = {
    id: `${timestamp}-${Math.random().toString(36).slice(2, 8)}`,
    event,
    data,
    timestamp,
  };

  try {
    // ZADD with timestamp as score, JSON as member
    await redis.zadd(redisKey, { score: timestamp, member: JSON.stringify(storedEvent) });

    // Trim to max entries (keep newest)
    const totalEntries = await redis.zcard(redisKey);
    if (totalEntries > EVENT_MAX_ENTRIES) {
      await redis.zremrangebyrank(redisKey, 0, totalEntries - EVENT_MAX_ENTRIES - 1);
    }

    // Set TTL on the key (refreshed each time)
    await redis.expire(redisKey, EVENT_TTL_SECONDS);
  } catch (err) {
    logger.error({ err }, "Failed to persist event to Redis");
  }
}

/**
 * Fetch events from Redis that occurred after a given timestamp.
 * Used by SSE clients on reconnection to catch up on missed events.
 */
export async function getEventsSince(orgId: string, sinceTimestamp: number): Promise<StoredEvent[]> {
  if (!redis) return [];

  const redisKey = `events:${orgId}`;

  try {
    const results = await redis.zrange(redisKey, sinceTimestamp, '+inf', { byScore: true }) as string[];
    return results.map((r) => {
      const raw = typeof r === 'string' ? r : JSON.stringify(r);
      return JSON.parse(raw) as StoredEvent;
    });
  } catch (err) {
    logger.error({ err }, "Failed to fetch events from Redis");
    return [];
  }
}
