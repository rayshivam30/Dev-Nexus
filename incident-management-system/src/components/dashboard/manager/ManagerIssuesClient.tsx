"use client";

import { useState } from "react";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { IssueDetailModal, TeamData, DeveloperData } from "@/components/dashboard/shared/IssueDetailModal";
import { useRouter } from "next/navigation";

interface ManagerIssuesClientProps {
  initialIssues: Issue[];
  teams: TeamData[];
  allDevelopers: DeveloperData[];
}

export function ManagerIssuesClient({ initialIssues, teams, allDevelopers }: ManagerIssuesClientProps) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleAssignSubmit(teamId: string, devId: string) {
    if (!selectedIssue) return;
    setIsAssigning(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId: teamId || undefined, assignedToId: devId || undefined, status: "ASSIGNED" }),
      });
      if (!res.ok) {
        throw new Error("Failed to assign issue");
      }
      setSelectedIssue(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign issue");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, rootCause: rootCause || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Issues</h1>
        <p className="text-foreground/60 mt-1">All issues within your project&apos;s teams.</p>
      </div>


      {initialIssues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-12 text-center text-foreground/50 italic">
          No issues found in this project yet.
        </div>
      ) : (
        <div className="mt-4">
          <RecentIssues 
            issues={initialIssues} 
            onRowClick={(issue) => setSelectedIssue(issue)} 
            onAssignClick={(issue) => setSelectedIssue(issue)}
          />
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          allowAssign={true}
          teams={teams}
          developers={allDevelopers}
          onAssignSubmit={handleAssignSubmit}
          onStatusChange={handleStatusChange}
          isAssigning={isAssigning}
        />
      )}
    </div>
  );
}
