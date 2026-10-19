import pino from "pino";
import { getRequestId } from "@/lib/request-id";

const isProduction = process.env.NODE_ENV === "production";

/**
 * Base logger with request ID injection via mixin.
 * Every log line automatically includes the requestId from AsyncLocalStorage
 * when called within a request context.
 */
export const logger = pino({
  level: process.env.LOG_LEVEL || "info",
  mixin() {
    const requestId = getRequestId();
    return requestId !== "unknown" ? { requestId } : {};
  },
  transport: !isProduction
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      }
    : undefined, // Let standard pino handle production logging as JSON
});
