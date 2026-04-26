import { NextRequest } from 'next/server';
import { eventEmitter, EVENTS } from '@/lib/events';
import { getCurrentUser } from '@/lib/api-utils';

interface EventData {
  orgId: string;
  [key: string]: unknown;
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  
  if (!user || !user.orgId) {
    return new Response('Unauthorized', { status: 401 });
  }

  const orgId = user.orgId;
  const stream = new ReadableStream({
    start(controller) {
      // Helper to create SSE data message
      const sendEvent = (event: string, data: EventData) => {
        if (data.orgId === orgId) {
          controller.enqueue(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
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

      // Keep connection alive
      const heartbeat = setInterval(() => {
        controller.enqueue(': heartbeat\n\n');
      }, 30000);

      req.signal.addEventListener('abort', () => {
        Object.entries(handlers).forEach(([event, handler]) => {
          eventEmitter.off(event, handler);
        });
        clearInterval(heartbeat);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
