import { prisma } from "../src/lib/db";

async function main() {
  const count = await prisma.issue.count({
    where: { status: "RESOLVED" }
  });
  console.log("Resolved issues count:", count);
  const users = await prisma.user.findMany();
  console.log("Total users:", users.length);
  for (const user of users) {
      const uRes = await prisma.issue.count({
        where: { status: "RESOLVED", assignedToId: user.id }
      });
      console.log(`User ${user.email} stats:`, { 
        name: user.name, 
        bio: user.bio, 
        image: user.image, 
        phoneNumber: user.phoneNumber, 
        location: user.location, 
        githubUrl: user.githubUrl, 
        linkedinUrl: user.linkedinUrl, 
        skills: user.skills 
      });
      console.log(`User ${user.email} has ${uRes} resolved issues.`);
  }

}

main().catch(console.error).finally(() => prisma.$disconnect());
