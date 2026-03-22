"use client";

import { useState } from "react";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

interface DeveloperIssuesClientProps {
  issues: Issue[];
}

export function DeveloperIssuesClient({ issues }: DeveloperIssuesClientProps) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    setStatusUpdating(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, rootCause: rootCause || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      window.location.reload();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setStatusUpdating(false);
    }
  }

  const severityColor: Record<string, string> = {
    CRITICAL: "text-red-500 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-500 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    LOW: "text-blue-500 bg-blue-500/10 border-blue-500/20",
  };

  const statusColor: Record<string, string> = {
    OPEN: "text-foreground/60 bg-foreground/10",
    ASSIGNED: "text-blue-400 bg-blue-400/10",
    IN_PROGRESS: "text-amber-400 bg-amber-400/10",
    RESOLVED: "text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Issues</h1>
        <p className="text-foreground/60 mt-1">Issues currently assigned to you.</p>
      </div>

      {issues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center space-y-3">
          <p className="text-xl font-semibold text-foreground">You're all caught up! 🎉</p>
          <p className="text-sm text-foreground/50">No open issues are assigned to you right now.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {issues.map((issue) => (
            <div
              key={issue.id}
              onClick={() => setSelectedIssue(issue)}
              className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
            >
              <div className="space-y-1 flex-1">
                <p className="font-medium text-foreground">{issue.title}</p>
                <p className="text-sm text-foreground/50 line-clamp-1">{issue.description}</p>
                <div className="flex gap-2 text-[10px] mt-1">
                  {issue.teamName && (
                    <span className="text-foreground/40">Team: <span className="text-foreground/60">{issue.teamName}</span></span>
                  )}
                  {issue.rootCause && (
                    <span className="text-emerald-500/80 italic">· Resolved with Root Cause</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-1 rounded border font-medium ${severityColor[issue.severity || ""] ?? ""}`}>
                  {issue.severity}
                </span>
                <span className={`text-xs px-2 py-1 rounded font-medium ${statusColor[issue.status || ""] ?? ""}`}>
                  {(issue.status || "").replace("_", " ")}
                </span>
                {issue.status === "ASSIGNED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleStatusChange(issue.id, "IN_PROGRESS"); }}
                    disabled={statusUpdating}
                    className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-md text-sm font-medium transition disabled:opacity-50"
                  >
                    Start Progress
                  </button>
                )}
                {issue.status === "IN_PROGRESS" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedIssue(issue); }} // Open modal to show resolution flow
                    disabled={statusUpdating}
                    className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-sm font-medium transition disabled:opacity-50"
                  >
                    Resolve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          allowAssign={false}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
