"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface EventData {
  orgId: string;
  issueId?: string;
  title?: string;
  severity?: string;
  status?: string;
  authorEmail?: string;
  content?: string;
  [key: string]: unknown;
}

export function RealtimeListener() {
  const router = useRouter();
  const pathname = usePathname();
  const { showToast } = useToast();
  const swRegistrationRef = useRef<ServiceWorkerRegistration | null>(null);

  // 1. Register Service Worker & Request Notification Permission
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    async function setupServiceWorker() {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        swRegistrationRef.current = registration;

        // Request permission for native system notifications
        if ("Notification" in window && Notification.permission === "default") {
          await Notification.requestPermission();
        }
      } catch (err) {
        console.error("Service worker registration failed:", err);
      }
    }

    setupServiceWorker();
  }, []);

  // 2. Establish Server-Sent Events (SSE) Subscription when inside the dashboard and authenticated
  useEffect(() => {
    if (typeof window === "undefined") return;

    // Only establish connection if we are in the dashboard area
    if (!pathname.startsWith("/dashboard")) return;

    // Check if the user is logged in
    const token = localStorage.getItem("incident_token");
    if (!token) return;

    let eventSource: EventSource;

    const connectSSE = () => {
      // SSE connection
      eventSource = new EventSource("/api/notifications/subscribe");

      // Helper to post message to Service Worker for background native OS notifications
      const triggerSystemNotification = (title: string, body: string, url: string, issueId?: string, severity?: string) => {
        const authToken = localStorage.getItem("incident_token");
        if (
          "Notification" in window &&
          Notification.permission === "granted" &&
          document.visibilityState !== "visible" && // Only show native notification if page is not active/focused
          navigator.serviceWorker.controller
        ) {
          navigator.serviceWorker.controller.postMessage({
            type: "SHOW_NOTIFICATION",
            payload: { title, body, url, token: authToken, issueId, severity },
          });
        }
      };

      // Helper to derive the role from pathname
      const getRolePath = () => {
        if (pathname.includes("/dashboard/admin")) return "admin";
        if (pathname.includes("/dashboard/manager")) return "manager";
        return "developer";
      };

      // EVENT: Incident Created
      eventSource.addEventListener("incident:created", (event) => {
        try {
          const data = JSON.parse(event.data) as EventData;
          const role = getRolePath();
          const targetUrl = `/dashboard/${role}/issues/${data.issueId || ""}`;

          // Show rich client-side Toast Notification
          showToast({
            title: "🔥 New Incident Reported",
            description: `${data.title || "An error has been reported."} [Severity: ${data.severity || "MEDIUM"}]`,
            tone: "error",
          });

          // Show native Desktop Push notification with rich action buttons and tag deduplication
          triggerSystemNotification(
            "🔥 New Incident Reported",
            `${data.title || "An error has been reported."} (Severity: ${data.severity || "MEDIUM"})`,
            targetUrl,
            data.issueId,
            data.severity
          );

          // Refresh current router view instantly to sync server components
          router.refresh();
        } catch (err) {
          console.error("Error parsing incident:created SSE data:", err);
        }
      });

      // EVENT: Incident Updated (or AI analysis resolved)
      eventSource.addEventListener("incident:updated", (event) => {
        try {
          const data = JSON.parse(event.data) as EventData;
          const role = getRolePath();
          const targetUrl = `/dashboard/${role}/issues/${data.issueId || ""}`;

          showToast({
            title: "🔄 Incident Updated",
            description: `"${data.title || "Issue"}" has been updated. Status: ${data.status?.replace("_", " ") || "UPDATED"}`,
            tone: "success",
          });

          triggerSystemNotification(
            "🔄 Incident Updated",
            `"${data.title || "Issue"}" status changed to ${data.status?.replace("_", " ") || "UPDATED"}`,
            targetUrl,
            data.issueId,
            data.severity
          );

          router.refresh();
        } catch (err) {
          console.error("Error parsing incident:updated SSE data:", err);
        }
      });

      // EVENT: Incident Assigned
      eventSource.addEventListener("incident:assigned", (event) => {
        try {
          const data = JSON.parse(event.data) as EventData;
          const role = getRolePath();
          const targetUrl = `/dashboard/${role}/issues/${data.issueId || ""}`;

          showToast({
            title: "🎯 Issue Assigned",
            description: `"${data.title || "An incident"}" has been assigned for resolution.`,
            tone: "info",
          });

          triggerSystemNotification(
            "🎯 Issue Assigned",
            `"${data.title || "An incident"}" has been assigned.`,
            targetUrl,
            data.issueId,
            data.severity
          );

          router.refresh();
        } catch (err) {
          console.error("Error parsing incident:assigned SSE data:", err);
        }
      });

      // EVENT: Comment Added
      eventSource.addEventListener("incident:comment_added", (event) => {
        try {
          const data = JSON.parse(event.data) as EventData;
          const role = getRolePath();
          const targetUrl = `/dashboard/${role}/issues/${data.issueId || ""}`;

          showToast({
            title: "💬 New Comment",
            description: `${data.authorEmail || "Someone"} commented: "${data.content?.substring(0, 50) || ""}..."`,
            tone: "info",
          });

          triggerSystemNotification(
            "💬 New Comment",
            `${data.authorEmail || "Someone"} commented on issue.`,
            targetUrl,
            data.issueId
          );

          router.refresh();
        } catch (err) {
          console.error("Error parsing incident:comment_added SSE data:", err);
        }
      });

      // EVENT: SLA Breach Alert
      eventSource.addEventListener("incident:sla_breach", (event) => {
        try {
          const data = JSON.parse(event.data) as EventData;
          const role = getRolePath();
          const targetUrl = `/dashboard/${role}/issues/${data.issueId || ""}`;

          showToast({
            title: "⚠️ SLA Breach Warning",
            description: `SLA breach detected for incident: "${data.title || "Issue"}"`,
            tone: "error",
          });

          triggerSystemNotification(
            "⚠️ SLA Breach Warning",
            `SLA deadline breached for: "${data.title || "Issue"}"`,
            targetUrl,
            data.issueId,
            "CRITICAL"
          );

          router.refresh();
        } catch (err) {
          console.error("Error parsing incident:sla_breach SSE data:", err);
        }
      });

      eventSource.onerror = (err) => {
        console.error("RealtimeListener SSE Error:", err);
        eventSource.close();
        
        // Retry connection after 5 seconds
        setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [pathname, router, showToast]);

  return null; // This component runs entirely client-side logic and doesn't render any visible UI
}
