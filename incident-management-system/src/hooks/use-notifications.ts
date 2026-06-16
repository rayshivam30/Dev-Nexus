import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationData {
  issueId: string;
  title: string;
  severity: string;
  status?: string;
}

export function useNotifications(
  onNewIncident?: (data: NotificationData) => void,
  onIncidentUpdated?: (data: NotificationData) => void
) {
  const router = useRouter();
  const retryCountRef = useRef(0);
  const maxRetries = 10;
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let eventSource: EventSource | null = null;

    const connect = () => {
      if (eventSource) {
        eventSource.close();
      }

      eventSource = new EventSource('/api/notifications/subscribe');

      eventSource.onopen = () => {
        retryCountRef.current = 0;
        console.log("SSE connection established");
      };

      eventSource.addEventListener('incident:created', (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationData;
          if (onNewIncident) onNewIncident(data);
          router.refresh();
        } catch (error) {
          console.error("Failed to parse incident:created event", error);
        }
      });

      eventSource.addEventListener('incident:updated', (event) => {
        try {
          const data = JSON.parse(event.data) as NotificationData;
          if (onIncidentUpdated) onIncidentUpdated(data);
          router.refresh();
        } catch (error) {
          console.error("Failed to parse incident:updated event", error);
        }
      });

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }

        if (retryCountRef.current < maxRetries) {
          const backoffDelay = Math.min(1000 * Math.pow(2, retryCountRef.current), 30000); // Max 30 seconds backoff
          console.log(`Retrying SSE connection in ${backoffDelay}ms (attempt ${retryCountRef.current + 1}/${maxRetries})`);
          
          timeoutRef.current = setTimeout(() => {
            retryCountRef.current++;
            connect();
          }, backoffDelay);
        } else {
          console.error("Max SSE retries reached");
        }
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onNewIncident, onIncidentUpdated, router]);
}
