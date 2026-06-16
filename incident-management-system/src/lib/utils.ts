import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Gets the base URL of the application.
 * Priority: Env Var > Headers (Server) > Window (Client)
 */
export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Fallback for server-side where env might be missing
  return `http://localhost:${process.env.PORT || 3000}`;
}

export function formatTimeAgo(date: Date) {
  const diffMins = Math.floor((Date.now() - date.getTime()) / 60000);
  if (diffMins < 1) return "just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character];
  });
}

export class FetchError extends Error {
  constructor(
    message: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public info: any,
    public status: number
  ) {
    super(message);
    this.name = "FetchError";
  }
}

export const fetcher = async (url: string) => {
  try {
    const res = await fetch(url);

    // Handle non-OK responses
    if (!res.ok) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let errorData: any = {};
      
      try {
        errorData = await res.json();
      } catch {
        errorData = { error: `HTTP ${res.status}: ${res.statusText}` };
      }

      // Handle network / CORS issues specifically
      if (res.status === 0) {
        throw new FetchError(
          "Network error - CORS or connection failed",
          { status: 0, error: "CORS_ERROR" },
          0
        );
      }

      throw new FetchError(
        errorData.error || "An error occurred while fetching the data.",
        errorData,
        res.status
      );
    }

    // Parse response
    let data;
    try {
      data = await res.json();
    } catch {
      throw new FetchError(
        "Invalid JSON response from server",
        { error: "PARSE_ERROR" },
        res.status
      );
    }

    return data;
  } catch (err) {
    // Handle network errors
    if (err instanceof TypeError) {
      if (err.message.includes("CORS")) {
        throw new FetchError(
          "CORS error - cross-origin request blocked",
          err,
          0
        );
      }
      if (err.message.includes("Failed to fetch")) {
        throw new FetchError(
          "Network error - check your connection",
          err,
          0
        );
      }
    }

    // Re-throw FetchError as-is
    if (err instanceof FetchError) {
      throw err;
    }

    // Handle unknown errors
    throw new FetchError(
      "An unexpected error occurred",
      err,
      500
    );
  }
};
