import { logger } from "@/lib/logger";

export interface AuditLogOptions {
  action: string;
  userId?: string;
  resource: string;
  resourceId?: string;
  changes?: Record<string, unknown>;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
}

export function logAuditEvent(options: AuditLogOptions) {
  logger.info(
    {
      audit: true,
      action: options.action,
      userId: options.userId || "anonymous",
      resource: options.resource,
      resourceId: options.resourceId,
      changes: options.changes,
      ipAddress: options.ipAddress,
      userAgent: options.userAgent,
      success: options.success,
      timestamp: new Date().toISOString(),
    },
    `Audit Event: ${options.action} - ${options.success ? "SUCCESS" : "FAILURE"}`
  );
}
