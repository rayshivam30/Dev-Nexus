import { prisma } from "@/lib/db";

export async function createIssue(data: {
  title: string;
  description: string;
  severity: any;
  projectId: string;
  teamId?: string;
  assignedToId?: string;
  role: string;
}) {
  const { title, description, severity, projectId, teamId, assignedToId, role } = data;

  const issueData: any = {
    title,
    description,
    severity,
    projectId,
    source: "MANUAL",
    status: "OPEN" 
  };

  if (teamId) issueData.teamId = teamId;

  if (assignedToId) {
    if (role === "MANAGER") {
      issueData.assignedToId = assignedToId;
      issueData.status = "ASSIGNED";
    } else {
      issueData.logs = { suggestedAssigneeId: assignedToId };
    }
  }

  return await prisma.issue.create({
    data: issueData,
  });
}

export async function getIssuesByProject(projectId: string) {
  return await prisma.issue.findMany({
    where: { projectId },
    include: {
      assignedTo: {
        select: { id: true, email: true }
      },
      team: {
        select: { id: true, name: true }
      }
    },
    orderBy: { createdAt: 'desc' }
  });
}
