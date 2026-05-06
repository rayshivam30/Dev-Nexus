import { prisma } from "@/lib/db";
import { DeveloperIssueDetailClient, DetailedIssue } from "@/components/dashboard/developer/issue-detail/DeveloperIssueDetailClient";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken } from "@/lib/jwt";

export const dynamic = "force-dynamic";

export default async function DeveloperIssueDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await cookies();
  const token = cookieStore.get("incident_token")?.value;
  if (!token) redirect("/auth/login");

  const decoded = verifyToken(token);
  if (!decoded || decoded.role !== "DEVELOPER") redirect("/auth/login");

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const issue = await prisma.issue.findUnique({
    where: { id },
    include: { team: true, assignedTo: true }
  });

  if (!issue) {
    return (
      <div className="p-12 text-center border border-white/[0.06] bg-white/[0.01] rounded-2xl max-w-xl mx-auto mt-24">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-400">Issue Not Found</h1>
        <p className="mt-2 text-sm text-zinc-500">The requested incident packet does not exist on this node.</p>
      </div>
    );
  }

  // Flatten the issue for the component if needed, or pass it as is
  const issueData = {
    ...issue,
    timeAgo: "Just now", // Will be updated on client
    teamName: issue.team?.name || "",
    assignedToEmail: issue.assignedTo?.email || "",
  } as unknown as DetailedIssue;

  return (
    <div className="max-w-7xl mx-auto">
      <DeveloperIssueDetailClient issueId={id} initialIssue={issueData} />
    </div>
  );
}
