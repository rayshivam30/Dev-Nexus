import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, orgId: true, projectId: true }
  });
  console.log(`Found ${users.length} total users.`);

  for (const user of users) {
    const now = new Date();
    let stats = { resolvedCount: 0, breachedCount: 0, totalIssuesCount: 0 };
    
    if (user.role === "ADMIN" && user.orgId) {
      const resolved = await prisma.issue.count({
        where: { project: { orgId: user.orgId }, status: "RESOLVED" },
      });
      const breached = await prisma.issue.count({
        where: { 
          project: { orgId: user.orgId }, 
          OR: [
            { responseBreached: true }, 
            { resolutionBreached: true },
            { responseSlaDeadline: { lt: now }, status: "OPEN" },
            { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
          ] 
        },
      });
      const total = await prisma.issue.count({
        where: { project: { orgId: user.orgId } },
      });
      stats = { resolvedCount: resolved, breachedCount: breached, totalIssuesCount: total };
    } else if (user.role === "MANAGER" && user.projectId) {
      const resolved = await prisma.issue.count({
        where: { projectId: user.projectId, status: "RESOLVED" },
      });
      const breached = await prisma.issue.count({
        where: { 
          projectId: user.projectId, 
          OR: [
            { responseBreached: true }, 
            { resolutionBreached: true },
            { responseSlaDeadline: { lt: now }, status: "OPEN" },
            { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
          ] 
        },
      });
      const total = await prisma.issue.count({
        where: { projectId: user.projectId },
      });
      stats = { resolvedCount: resolved, breachedCount: breached, totalIssuesCount: total };
    } else {
      const resolved = await prisma.issue.count({
        where: { assignedToId: user.id, status: "RESOLVED" },
      });
      const breached = await prisma.issue.count({
        where: { 
          assignedToId: user.id, 
          OR: [
            { responseBreached: true }, 
            { resolutionBreached: true },
            { responseSlaDeadline: { lt: now }, status: "OPEN" },
            { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
          ] 
        },
      });
      const total = await prisma.issue.count({
        where: { assignedToId: user.id },
      });
      stats = { resolvedCount: resolved, breachedCount: breached, totalIssuesCount: total };
    }

    console.log(`[${user.role}] ${user.email} (OrgId: ${user.orgId || "N/A"}, ProjId: ${user.projectId || "N/A"}) -> Resolved: ${stats.resolvedCount}, Breached: ${stats.breachedCount}, Total: ${stats.totalIssuesCount}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
