"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

export function DeveloperResolvedClient({ resolvedIssues }: { resolvedIssues: Issue[] }) {
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resolved Issues</h1>
        <p className="text-foreground/60 mt-1">
          Issues you&apos;ve resolved. Total: <span className="font-semibold text-foreground">{resolvedIssues.length}</span>
        </p>

      </div>

      {resolvedIssues.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center space-y-3">
          <p className="text-foreground/50 text-sm">No resolved issues yet.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
          {resolvedIssues.map((issue) => {
            return (
              <div
                key={issue.id}
                onClick={() => setSelectedIssue(issue)}
                className="p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3 hover:bg-accent/30 transition-colors cursor-pointer"
              >
                <div className="flex items-start gap-3 flex-1">
                  <CheckCircle className="w-4 h-4 text-emerald-500 mt-1 shrink-0" />
                  <div className="space-y-1">
                    <p className="font-medium text-foreground">{issue.title}</p>
                    <p className="text-sm text-foreground/50 line-clamp-1">{issue.description}</p>
                    {issue.teamName && (
                      <p className="text-xs text-foreground/40">Team: <span className="text-foreground/60">{issue.teamName}</span></p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded font-medium">
                    RESOLVED
                  </span>
                  <span className="text-xs text-foreground/40 font-mono">{issue.timeAgo}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          allowAssign={false}
        />
      )}
    </div>
  );
}
