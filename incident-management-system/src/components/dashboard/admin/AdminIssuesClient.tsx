"use client";

import { useState } from "react";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";

interface AdminIssuesClientProps {
  issues: Issue[];
  teams: TeamData[];
  developers: DeveloperData[];
}

export function AdminIssuesClient({ issues, teams, developers }: AdminIssuesClientProps) {
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
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to assign issue");
      }
      setSelectedIssue(null);
      window.location.reload();
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
      // Note: Modal will refresh its own data, but we refresh page to update list
      window.location.reload();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }


  return (
    <>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {issues.map((issue) => (
          <div
            key={issue.id}
            onClick={() => setSelectedIssue(issue)}
            className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
          >
            <div className="space-y-1 flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{issue.title}</p>
              <p className="text-sm text-foreground/50 line-clamp-1">{issue.description}</p>
              <div className="flex gap-2 text-[10px] mt-1">
                 <span className="text-foreground/40">Team: <span className="text-foreground/80">{issue.team?.name || "—"}</span></span>
                 {issue.assignedTo?.email && (
                  <span className="text-foreground/40">· <span className="text-foreground/80">{issue.assignedTo.email}</span></span>
                 )}
                 {issue.environment && (
                  <span className="text-blue-500/80">· {issue.environment}</span>
                 )}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`text-xs px-2 py-1 rounded border font-medium ${
                issue.severity === 'CRITICAL' ? 'text-red-500 bg-red-500/10 border-red-500/20' :
                issue.severity === 'HIGH' ? 'text-orange-500 bg-orange-500/10 border-orange-500/20' :
                issue.severity === 'MEDIUM' ? 'text-amber-500 bg-amber-500/10 border-amber-500/20' :
                'text-blue-500 bg-blue-500/10 border-blue-500/20'
              }`}>
                {issue.severity}
              </span>
              <span className={`text-xs px-2 py-1 rounded font-medium ${
                issue.status === 'OPEN' ? 'text-foreground/60 bg-foreground/10' :
                issue.status === 'ASSIGNED' ? 'text-blue-400 bg-blue-400/10' :
                issue.status === 'IN_PROGRESS' ? 'text-amber-400 bg-amber-400/10' :
                'text-emerald-400 bg-emerald-400/10'
              }`}>
                {issue.status?.replace("_", " ")}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          allowAssign={true}
          teams={teams}
          developers={developers}
          onAssignSubmit={handleAssignSubmit}
          onStatusChange={handleStatusChange}
          isAssigning={isAssigning}
        />
      )}
    </>
  );
}
