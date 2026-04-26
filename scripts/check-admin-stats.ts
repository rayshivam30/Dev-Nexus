import { prisma } from "../src/lib/db";

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, email: true, role: true, orgId: true }
  });
  console.log(`Found ${users.length} users.`);


  for (const admin of users) {
    console.log(`\nAdmin: ${admin.email}, OrgId: ${admin.orgId}`);
    if (admin.orgId) {
      const now = new Date();
      const breachedCount = await prisma.issue.count({
        where: { 
          project: { orgId: admin.orgId }, 
          OR: [
              { responseBreached: true }, 
              { resolutionBreached: true },
              { responseSlaDeadline: { lt: now }, status: "OPEN" },
              { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
          ] 
        },
      });
      console.log(`Breached issues in org (Live Check): ${breachedCount}`);
      
      const unassignedBreached = await prisma.issue.count({
          where: {
              project: { orgId: admin.orgId },
              assignedToId: null,
              OR: [
                  { responseSlaDeadline: { lt: now }, status: "OPEN" },
                  { resolutionSlaDeadline: { lt: now }, status: { not: "RESOLVED" } }
              ]
          }
      });
      console.log(`Unassigned Breached issues in org: ${unassignedBreached}`);

      
      const resolvedCount = await prisma.issue.count({
          where: { project: { orgId: admin.orgId }, status: "RESOLVED" },
      });
      console.log(`Resolved issues in org: ${resolvedCount}`);
    }
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
