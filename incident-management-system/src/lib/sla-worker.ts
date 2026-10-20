import { prisma } from "@/lib/db";
import { logger } from "@/lib/logger";
import { EVENTS, emitEvent } from "@/lib/events";
import { notifyOrgStaff, createNotification } from "@/services/notification-service";

const POLL_INTERVAL_MS = process.env.NODE_ENV === "test" ? 250 : 30_000;
let timer: ReturnType<typeof setInterval> | undefined;
let running = false;

async function sweepSlaBreaches() {
  if (running) return;
  running = true;
  try {
    const now = new Date();
    const due = await prisma.issue.findMany({
      where: {
        deletedAt: null,
        status: { not: "RESOLVED" },
        OR: [
          { responseBreached: false, acceptedAt: null, status: "OPEN", responseSlaDeadline: { lt: now } },
          { resolutionBreached: false, resolutionSlaDeadline: { lt: now } },
        ],
      },
      select: {
        id: true, title: true, projectId: true, assignedToId: true,
        project: { select: { orgId: true } },
        responseBreached: true, resolutionBreached: true,
        responseSlaDeadline: true, resolutionSlaDeadline: true,
        status: true, acceptedAt: true,
      },
      take: 200,
    });

    for (const issue of due) {
      const breaches: Array<"response" | "resolution"> = [];
      if (!issue.responseBreached && issue.status === "OPEN" && !issue.acceptedAt && issue.responseSlaDeadline && issue.responseSlaDeadline < now) breaches.push("response");
      if (!issue.resolutionBreached && issue.resolutionSlaDeadline && issue.resolutionSlaDeadline < now) breaches.push("resolution");
      for (const breach of breaches) {
        const claimed = await prisma.issue.updateMany({
          where: {
            id: issue.id,
            ...(breach === "response"
              ? { responseBreached: false, acceptedAt: null, status: "OPEN", responseSlaDeadline: { lt: now } }
              : { resolutionBreached: false, resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }),
          },
          data: breach === "response" ? { responseBreached: true } : { resolutionBreached: true },
        });
        if (claimed.count !== 1) continue;

        const label = breach === "response" ? "Response SLA" : "Resolution SLA";
        const message = `${label} breached for “${issue.title}”.`;
        await notifyOrgStaff(issue.project.orgId, {
          type: "SLA", title: `${label} breached`, message,
          link: `/dashboard/admin/issues/${issue.id}`,
          linkByRole: { ADMIN: `/dashboard/admin/issues/${issue.id}`, MANAGER: "/dashboard/manager/issues" },
          projectId: issue.projectId,
        });
        if (issue.assignedToId) {
          await createNotification({
            userId: issue.assignedToId, type: "SLA", title: `${label} breached`, message,
            link: `/dashboard/developer/issues/${issue.id}`,
          });
        }
        await emitEvent(EVENTS.SLA_BREACHED, {
          issueId: issue.id, orgId: issue.project.orgId, projectId: issue.projectId,
          title: issue.title, breach, status: issue.status,
        });
      }
    }
  } catch (error) {
    logger.error({ err: error }, "SLA breach sweep failed");
  } finally {
    running = false;
  }
}

export function startSlaWorker() {
  if (timer || process.env.NEXT_RUNTIME === "edge") return;
  timer = setInterval(() => void sweepSlaBreaches(), POLL_INTERVAL_MS);
  timer.unref();
  void sweepSlaBreaches();
  logger.info("SLA breach worker started");
}
