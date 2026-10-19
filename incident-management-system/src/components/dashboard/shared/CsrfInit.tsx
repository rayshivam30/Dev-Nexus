"use client";

import { useEffect } from "react";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf-store";

interface PatchedFetch {
  patched?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<(success: boolean) => void> = [];

async function triggerSilentRefresh(originalFetch: typeof window.fetch): Promise<boolean> {
  if (isRefreshing) {
    return new Promise((resolve) => {
      refreshQueue.push(resolve);
    });
  }

  isRefreshing = true;
  try {
    const csrfToken = getCsrfToken();
    const res = await originalFetch("/api/auth/refresh", {
      method: "POST",
      credentials: "same-origin",
      headers: csrfToken ? { "X-CSRF-Token": csrfToken } : undefined,
    });
    const success = res.ok;
    refreshQueue.forEach((resolve) => resolve(success));
    refreshQueue = [];
    return success;
  } catch {
    refreshQueue.forEach((resolve) => resolve(false));
    refreshQueue = [];
    return false;
  } finally {
    isRefreshing = false;
  }
}

export function CsrfInit() {
  useEffect(() => {
    // 1. Initial CSRF token fetch
    async function loadToken() {
      try {
        const response = await fetch("/api/csrf-token");
        if (response.ok) {
          const data = await response.json();
          setCsrfToken(data.token);
        }
      } catch (err) {
        console.error("Failed to load CSRF token:", err);
      }
    }

    loadToken();

    // 2. Intercept global window.fetch to inject X-CSRF-Token and handle 401 token refresh
    if (typeof window !== "undefined") {
      const winFetch = window.fetch as typeof window.fetch & PatchedFetch;
      if (!winFetch.patched) {
        const originalFetch = window.fetch;
        const newFetch = async function (input: RequestInfo | URL, init?: RequestInit) {
          const url = typeof input === "string" 
            ? input 
            : (input instanceof URL ? input.toString() : input.url);
          const method = init?.method?.toUpperCase() || "GET";

          // Inject header for POST, PUT, PATCH, DELETE, unless it's the CSRF endpoint itself
          if (["POST", "PUT", "PATCH", "DELETE"].includes(method) && !url.includes("/api/csrf-token")) {
            const token = getCsrfToken();
            if (token) {
              init = init || {};
              // Parse existing headers safely
              let headersObj: Record<string, string> = {};
              if (init.headers) {
                if (init.headers instanceof Headers) {
                  init.headers.forEach((value, key) => {
                    headersObj[key] = value;
                  });
                } else if (Array.isArray(init.headers)) {
                  init.headers.forEach(([key, value]) => {
                    headersObj[key] = value;
                  });
                } else {
                  headersObj = { ...init.headers } as Record<string, string>;
                }
              }
              headersObj["X-CSRF-Token"] = token;
              init.headers = headersObj;
            }
          }

          const response = await originalFetch(input, init);

          // Handle 401 with silent token refresh
          if (
            response.status === 401 &&
            !url.includes("/api/auth/login") &&
            !url.includes("/api/auth/refresh") &&
            !url.includes("/api/auth/register") &&
            !url.includes("/api/csrf-token")
          ) {
            const refreshed = await triggerSilentRefresh(originalFetch);
            if (refreshed) {
              // Retry the original request with rotated session cookie
              return originalFetch(input, init);
            }
          }

          return response;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newFetch as any).patched = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        window.fetch = newFetch as any;
      }
    }
  }, []);

  return null;
}
