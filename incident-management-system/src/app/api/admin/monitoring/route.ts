import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { prisma } from "@/lib/db";
import { getEmailQueueStats } from "@/lib/mailer";
import { getCacheStats } from "@/lib/authorization";
import { logger } from "@/lib/logger";

export const GET = withAuth(async () => {
  try {
    const emailQueue = getEmailQueueStats();
    const cacheStats = getCacheStats();
    const [pending, processing, complete, failed] = await Promise.all([
      prisma.issue.count({ where: { logs: { path: ["aiJobStatus"], equals: "PENDING" } } }),
      prisma.issue.count({ where: { logs: { path: ["aiJobStatus"], equals: "PROCESSING" } } }),
      prisma.issue.count({ where: { logs: { path: ["aiJobStatus"], equals: "COMPLETE" } } }),
      prisma.issue.count({ where: { logs: { path: ["aiJobStatus"], equals: "FAILED" } } }),
    ]);

    return apiResponse("Telemetry data fetched successfully", {
      monitoring: {
        aiQueue: {
          pending,
          processing,
          complete,
          failed,
          successRate: complete + failed > 0 ? Number(((complete / (complete + failed)) * 100).toFixed(2)) : 100,
        },
        emailQueue: {
          queueLength: emailQueue.queueLength,
          dailyEmailsSent: emailQueue.dailySentCount,
          dailyLimitRemaining: emailQueue.dailyRemaining,
        },
        cache: {
          cacheHits: cacheStats.cacheHits,
          cacheMisses: cacheStats.cacheMisses,
          hitRatePercentage: cacheStats.hitRate,
        },
      },
    });
  } catch (error) {
    logger.error({ err: error }, "Telemetry fetch error");
    return apiError("Failed to fetch telemetry data", 500);
  }
}, ["ADMIN"]);
