import { prisma } from "../src/lib/db";

async function main() {
  const user = await prisma.user.findFirst({
    where: { role: "ADMIN" },
    select: { id: true, email: true, role: true, orgId: true }
  });
  if (!user) {
    console.log("No admin found.");
    return;
  }
  
  console.log(`Checking Admin: ${user.email}, OrgId: ${user.orgId}`);
  const now = new Date();
  
  if (user.orgId) {
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
      console.log(`Resolved: ${resolved}, Breached: ${breached}, Total: ${total}`);
      const breachRate = breached / total;
      const rating = Math.max(1, 5 * (1 - breachRate)).toFixed(1);
      console.log(`Rating: ${rating}`);
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
