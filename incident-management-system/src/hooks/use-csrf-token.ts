import { useEffect, useState } from "react";
import { getCsrfToken, setCsrfToken } from "@/lib/csrf-store";

/**
 * Hook to fetch and manage CSRF token
 * Token is refreshed on page load and sent with all state-changing requests
 */
export function useCsrfToken() {
  const [token, setTokenState] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    // Check if token is already in store
    const existingToken = getCsrfToken();
    if (existingToken) {
      setTokenState(existingToken);
      setIsLoading(false);
      return;
    }

    const fetchToken = async () => {
      try {
        const response = await fetch("/api/csrf-token");
        
        if (!response.ok) {
          throw new Error(`Failed to fetch CSRF token: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (mounted) {
          setCsrfToken(data.token);
          setTokenState(data.token);
          setError(null);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error("Unknown error"));
          console.error("CSRF token fetch error:", err);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchToken();

    return () => {
      mounted = false;
    };
  }, []);

  return { token, isLoading, error };
}

/**
 * Helper to add CSRF token to request headers
 */
export function addCsrfTokenToHeaders(
  headers: Record<string, string>,
  csrfToken: string
): Record<string, string> {
  return {
    ...headers,
    "X-CSRF-Token": csrfToken,
  };
}
