import { NextRequest } from 'next/server';
import { eventEmitter, EVENTS, getEventsSince } from '@/lib/events';
import { getCurrentUser } from '@/lib/api-utils';
import { logger } from '@/lib/logger';

interface EventData {
  orgId: string;
  [key: string]: unknown;
}

// ── Connection Tracking ──────────────────────────────────────────────────────
// Prevents the server from being overwhelmed by too many persistent SSE streams.
const MAX_SSE_CONNECTIONS = 120; // 100 users + headroom for reconnects
let activeConnections = 0;

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || !user.orgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  // Reject if too many connections are open
  if (activeConnections >= MAX_SSE_CONNECTIONS) {
    logger.warn(
      { activeConnections, max: MAX_SSE_CONNECTIONS },
      "SSE connection limit reached, rejecting new client"
    );
    return new Response(
      JSON.stringify({ error: "Too many active connections. Please retry shortly." }),
      { status: 503, headers: { 'Content-Type': 'application/json', 'Retry-After': '10' } }
    );
  }

  activeConnections++;
  const orgId = user.orgId;
  const encoder = new TextEncoder();

  // Check for Last-Event-ID header (reconnection catch-up)
  const lastEventId = req.headers.get('Last-Event-ID');
  let catchUpTimestamp = 0;
  if (lastEventId) {
    // Our event IDs are formatted as "{timestamp}-{random}", extract the timestamp
    const ts = parseInt(lastEventId.split('-')[0], 10);
    if (!isNaN(ts)) {
      catchUpTimestamp = ts;
    }
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (text: string) => {
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          // Stream already closed / errored — cleanup will happen via abort
        }
      };

      // ── Catch-up: send missed events from Redis ──────────────────────────
      if (catchUpTimestamp > 0) {
        try {
          const missedEvents = await getEventsSince(orgId, catchUpTimestamp + 1);
          for (const stored of missedEvents) {
            enqueue(`id: ${stored.id}\nevent: ${stored.event}\ndata: ${JSON.stringify(stored.data)}\n\n`);
          }
          logger.info(
            { orgId, missedCount: missedEvents.length, since: catchUpTimestamp },
            "SSE catch-up complete"
          );
        } catch (err) {
          logger.error({ err }, "SSE catch-up failed");
        }
      }

      // ── Real-time: EventEmitter for same-instance delivery ───────────────
      const sendEvent = (event: string, data: EventData) => {
        if (data.orgId === orgId) {
          const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
          enqueue(`id: ${id}\nevent: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
        }
      };

      const handlers = {
        [EVENTS.INCIDENT_CREATED]: (data: EventData) => sendEvent(EVENTS.INCIDENT_CREATED, data),
        [EVENTS.INCIDENT_UPDATED]: (data: EventData) => sendEvent(EVENTS.INCIDENT_UPDATED, data),
        [EVENTS.INCIDENT_ASSIGNED]: (data: EventData) => sendEvent(EVENTS.INCIDENT_ASSIGNED, data),
        [EVENTS.COMMENT_ADDED]: (data: EventData) => sendEvent(EVENTS.COMMENT_ADDED, data),
        [EVENTS.SLA_BREACHED]: (data: EventData) => sendEvent(EVENTS.SLA_BREACHED, data),
      };

      // Attach all listeners
      Object.entries(handlers).forEach(([event, handler]) => {
        eventEmitter.on(event, handler);
      });

      // Keep connection alive with heartbeat
      const heartbeat = setInterval(() => {
        enqueue(': heartbeat\n\n');
      }, 30000);

      // Cleanup function — called when client disconnects
      const cleanup = () => {
        Object.entries(handlers).forEach(([event, handler]) => {
          eventEmitter.off(event, handler);
        });
        clearInterval(heartbeat);
        activeConnections = Math.max(0, activeConnections - 1);
        logger.info(
          { activeConnections },
          "SSE client disconnected"
        );
      };

      // Client-initiated abort (tab close, navigate away, etc.)
      req.signal.addEventListener('abort', cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no', // Prevents nginx from buffering SSE
    },
  });
}
