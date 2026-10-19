import { NextRequest } from 'next/server';
import { eventEmitter, EVENTS, getEventsSince } from '@/lib/events';
import { getCurrentUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

interface EventData {
  orgId: string;
  eventId?: string;
  [key: string]: unknown;
}

const MAX_SSE_CONNECTIONS = 120;
const REDIS_POLL_INTERVAL_MS = 2_000;
let activeConnections = 0;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user?.orgId) return new Response('Unauthorized', { status: 401 });

  if (activeConnections >= MAX_SSE_CONNECTIONS) {
    logger.warn({ activeConnections, max: MAX_SSE_CONNECTIONS }, "SSE connection limit reached, rejecting new client");
    return new Response(JSON.stringify({ error: "Too many active connections. Please retry shortly." }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Retry-After': '10' },
    });
  }

  activeConnections++;
  const orgId = user.orgId;
  const encoder = new TextEncoder();
  const lastEventId = req.headers.get('Last-Event-ID');
  const parsedTimestamp = lastEventId ? Number.parseInt(lastEventId.split('-')[0], 10) : Number.NaN;
  const initialCursor = Number.isFinite(parsedTimestamp) && parsedTimestamp > 0 ? parsedTimestamp : Date.now();

  let cleanup = () => {};
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      let cursor = initialCursor;
      const seenIds = new Set<string>();
      const enqueue = (text: string) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          cleanup();
        }
      };
      const send = (event: string, data: EventData, id?: string) => {
        if (data.orgId !== orgId) return;
        const eventId = id || data.eventId || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        if (seenIds.has(eventId)) return;
        seenIds.add(eventId);
        if (seenIds.size > 500) {
          const oldest = seenIds.values().next().value;
          if (oldest) seenIds.delete(oldest);
        }
        const eventTimestamp = Number.parseInt(eventId.split('-')[0], 10);
        if (Number.isFinite(eventTimestamp)) cursor = Math.max(cursor, eventTimestamp);
        enqueue(`id: ${eventId}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
      };

      const handlers: Record<string, (data: EventData) => void> = {
        [EVENTS.INCIDENT_CREATED]: (data) => send(EVENTS.INCIDENT_CREATED, data),
        [EVENTS.INCIDENT_UPDATED]: (data) => send(EVENTS.INCIDENT_UPDATED, data),
        [EVENTS.INCIDENT_ASSIGNED]: (data) => send(EVENTS.INCIDENT_ASSIGNED, data),
        [EVENTS.COMMENT_ADDED]: (data) => send(EVENTS.COMMENT_ADDED, data),
        [EVENTS.SLA_BREACHED]: (data) => send(EVENTS.SLA_BREACHED, data),
      };

      Object.entries(handlers).forEach(([event, handler]) => eventEmitter.on(event, handler));
      const pollRedis = async () => {
        try {
          const storedEvents = await getEventsSince(orgId, cursor);
          for (const stored of storedEvents) send(stored.event, stored.data as EventData, stored.id);
        } catch (err) {
          logger.error({ err, orgId }, "SSE cross-instance event poll failed");
        }
      };

      let polling = false;
      const poll = async () => {
        if (polling || closed) return;
        polling = true;
        try { await pollRedis(); } finally { polling = false; }
      };
      const heartbeat = setInterval(() => enqueue(': heartbeat\n\n'), 30_000);
      const pollTimer = setInterval(() => { void poll(); }, REDIS_POLL_INTERVAL_MS);
      cleanup = () => {
        if (closed) return;
        closed = true;
        Object.entries(handlers).forEach(([event, handler]) => eventEmitter.off(event, handler));
        clearInterval(heartbeat);
        clearInterval(pollTimer);
        req.signal.removeEventListener('abort', cleanup);
        activeConnections = Math.max(0, activeConnections - 1);
        logger.info({ activeConnections }, "SSE client disconnected");
      };
      req.signal.addEventListener('abort', cleanup, { once: true });

      // Listeners are attached before catch-up, closing the race where an event
      // could otherwise land between Redis history and listener registration.
      await poll();
    },
    cancel() { cleanup(); },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
