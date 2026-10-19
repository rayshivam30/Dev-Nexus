import { AsyncLocalStorage } from "async_hooks";
import crypto from "crypto";

/**
 * Request-scoped context using AsyncLocalStorage.
 * Propagates the request ID through the entire call chain
 * without having to pass it as a parameter.
 */

interface RequestContext {
  requestId: string;
  startTime: number;
}

export const requestContext = new AsyncLocalStorage<RequestContext>();

/**
 * Generate a unique request ID.
 * Format: req_<uuid-v4-short> (e.g., req_a1b2c3d4e5f6)
 */
export function generateRequestId(): string {
  return `req_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
}

/**
 * Get the current request ID from async context.
 * Returns "unknown" if called outside a request context.
 */
export function getRequestId(): string {
  return requestContext.getStore()?.requestId ?? "unknown";
}

/**
 * Get the elapsed time in ms since the request started.
 */
export function getRequestDuration(): number {
  const store = requestContext.getStore();
  return store ? Date.now() - store.startTime : 0;
}

/**
 * Run a function within a request context.
 * The request ID is available to all downstream calls via getRequestId().
 */
export function withRequestContext<T>(requestId: string, fn: () => T): T {
  return requestContext.run({ requestId, startTime: Date.now() }, fn);
}
