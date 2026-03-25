"use client";

import { AlertTriangle } from "lucide-react";

export interface Issue {
  id: string;
  title: string;
  rootCause?: string | null;
  description: string;
  severity: "Low" | "Medium" | "High" | "Critical" | string;
  priority?: string | null;
  environment?: string | null;
  timeAgo: string;
  status?: string | null;
  logs?: Record<string, unknown> | null;



  teamName?: string | null;
  teamId?: string | null;
  projectId?: string | null;
  assignedToEmail?: string | null;
  resolvedAt?: Date | string | null;
  acceptedAt?: Date | string | null;
  responseSlaDeadline?: Date | string | null;
  resolutionSlaDeadline?: Date | string | null;
  responseBreached?: boolean | null;
  resolutionBreached?: boolean | null;
  team?: { id?: string | null; name: string } | null;
  assignedTo?: { id?: string | null; email: string; name?: string | null } | null;
  createdAt?: Date | string | null;
}


interface RecentIssuesProps {
  issues: Issue[];
  onAssignClick?: (issue: Issue) => void;
  onStatusChange?: (issueId: string, newStatus: string) => void;
  onRowClick?: (issue: Issue) => void;
}

export function RecentIssues({ issues, onAssignClick, onStatusChange, onRowClick }: RecentIssuesProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Recent Issues</h2>
      <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
        {issues.map((issue) => (
          <div 
            key={issue.id} 
            onClick={() => onRowClick && onRowClick(issue)}
            className="p-4 flex items-center justify-between hover:bg-accent/50 transition-colors group flex-wrap gap-4 cursor-pointer"
          >
            <div className="flex items-center space-x-4 max-w-full overflow-hidden">
              <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${issue.severity === 'Critical' || issue.severity === 'CRITICAL' ? 'bg-destructive animate-pulse' : 'bg-amber-500'}`} />
              <div className="min-w-0">
                <p className="font-medium text-white transition-colors group-hover:text-primary truncate">{issue.title}</p>
                <p className="text-sm text-foreground/50 truncate w-48 md:w-80 lg:w-96">
                  {issue.rootCause}
                </p>
                {issue.status === "OPEN" && !!issue.logs?.suggestedAssigneeId && (
                  <p className="text-xs text-amber-500/80 mt-1 italic">
                    Requires Assignment Approval
                  </p>
                )}

              </div>
            </div>
            
            <div className="flex items-center gap-4 shrink-0">
              <div className="flex flex-col items-end space-y-1 text-xs">
                {/* SLA Breach Badge */}
                {!issue.resolvedAt && (
                  (issue.responseSlaDeadline && new Date(issue.responseSlaDeadline) < new Date() && issue.status === "OPEN") ||
                  (issue.resolutionSlaDeadline && new Date(issue.resolutionSlaDeadline) < new Date() && issue.status !== "RESOLVED")
                ) && (
                  <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase tracking-wider animate-pulse">
                    <AlertTriangle className="w-3 h-3" /> SLA Breach
                  </span>
                )}
                
                <span className={`px-2 py-1 rounded border font-medium ${
                  issue.severity === 'Critical' || issue.severity === 'CRITICAL' ? 'bg-destructive/20 text-destructive border-destructive/20' : 'bg-amber-500/20 text-amber-500 border-amber-500/20'
                }`}>
                  {issue.severity}
                </span>
                <span className="text-foreground/40 font-mono">{issue.status ? issue.status.replace("_", " ") : issue.timeAgo}</span>
              </div>

              {/* Actions */}
              {onAssignClick && issue.status === "OPEN" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onAssignClick(issue); }}
                  className="px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary-foreground rounded-md text-sm font-medium transition"
                >
                  Assign
                </button>
              )}
              {onStatusChange && issue.status === "ASSIGNED" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "IN_PROGRESS"); }}
                  className="px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-md text-sm font-medium transition"
                >
                  Start Progress
                </button>
              )}
              {onStatusChange && issue.status === "IN_PROGRESS" && (
                <button
                  onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "RESOLVED"); }}
                  className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 rounded-md text-sm font-medium transition"
                >
                  Resolve
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
