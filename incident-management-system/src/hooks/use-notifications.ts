import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface NotificationData {
  issueId: string;
  title: string;
  severity: string;
  status?: string;
}

export function useNotifications(onNewIncident?: (data: NotificationData) => void, onIncidentUpdated?: (data: NotificationData) => void) {
  const router = useRouter();

  useEffect(() => {
    let eventSource: EventSource;

    const connect = () => {
      eventSource = new EventSource('/api/notifications/subscribe');

      eventSource.addEventListener('incident:created', (event) => {
        const data = JSON.parse(event.data) as NotificationData;
        if (onNewIncident) onNewIncident(data);
        // Refresh the current route to get updated data
        router.refresh();
      });

      eventSource.addEventListener('incident:updated', (event) => {
        const data = JSON.parse(event.data) as NotificationData;
        if (onIncidentUpdated) onIncidentUpdated(data);
        router.refresh();
      });

      eventSource.onerror = (error) => {
        console.error('SSE Error:', error);
        eventSource.close();
        // Retry connection after 5 seconds
        setTimeout(connect, 5000);
      };
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [onNewIncident, onIncidentUpdated, router]);
}
