import { withAuth, apiResponse, apiError } from "@/lib/api-utils";
import { getQueueStats } from "@/lib/ai-queue";
import { getEmailQueueStats } from "@/lib/mailer";
import { getCacheStats } from "@/lib/authorization";

export const GET = withAuth(async () => {
  try {
    const aiQueue = getQueueStats();
    const emailQueue = getEmailQueueStats();
    const cacheStats = getCacheStats();

    return apiResponse("Telemetry data fetched successfully", {
      monitoring: {
        aiQueue: {
          successRate: aiQueue.successRate,
          queueLength: aiQueue.queueLength,
          activeConcurrency: aiQueue.activeCount,
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
    console.error("Telemetry fetch error:", error);
    return apiError("Failed to fetch telemetry data", 500);
  }
}, ["ADMIN"]);
