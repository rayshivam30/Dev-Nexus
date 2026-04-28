"use client";

import { AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Issue {
  id: string;
  title: string;
  rootCause?: string | null;
  suggestedFixes?: string | null;
  description: string;

  severity: "Low" | "Medium" | "High" | "Critical" | string;
  priority?: string | null;
  environment?: string | null;
  timeAgo: string;
  status?: string | null;
  logs?: Record<string, unknown> | null;
  source?: string | null;

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

const severityColor: Record<string, string> = {
  Critical: "text-red-400 bg-red-400/10 border-red-400/20",
  CRITICAL: "text-red-400 bg-red-400/10 border-red-400/20",
  High: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  HIGH: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  Medium: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  MEDIUM: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  Low: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  LOW: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
};

const statusColor: Record<string, string> = {
  OPEN: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  ASSIGNED: "text-teal-400 bg-teal-400/10 border-teal-400/20",
  IN_PROGRESS: "text-blue-400 bg-blue-400/10 border-blue-400/20",
  RESOLVED: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
};

const severityDot: Record<string, string> = {
  Critical: "bg-red-500",
  CRITICAL: "bg-red-500",
  High: "bg-orange-500",
  HIGH: "bg-orange-500",
  Medium: "bg-amber-500",
  MEDIUM: "bg-amber-500",
  Low: "bg-zinc-500",
  LOW: "bg-zinc-500",
};

export function RecentIssues({ issues, onAssignClick, onStatusChange, onRowClick }: RecentIssuesProps) {
  if (issues.length === 0) {
    return (
      <div className="p-12 border border-white/[0.06] border-dashed rounded-2xl text-center">
        <p className="text-sm text-zinc-600">No active incidents</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold tracking-tight">Recent Incidents</h2>
        <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-2.5 py-1">{issues.length} total</span>
      </div>

      <div className="space-y-2">
        {issues.map((issue) => (
          <div 
            key={issue.id} 
            onClick={() => onRowClick && onRowClick(issue)}
            className="group cursor-pointer p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", severityDot[issue.severity] || "bg-zinc-500")} />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{issue.title}</p>
                  <p className="text-xs text-zinc-600 truncate mt-0.5 max-w-md">
                    {issue.rootCause || "Awaiting analysis..."}
                  </p>
                  
                  <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                    {/* SLA Breach */}
                    {!issue.resolvedAt && (
                      (issue.responseSlaDeadline && new Date(issue.responseSlaDeadline) < new Date() && issue.status === "OPEN") ||
                      (issue.resolutionSlaDeadline && new Date(issue.resolutionSlaDeadline) < new Date() && issue.status !== "RESOLVED")
                    ) && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-semibold">
                        <AlertTriangle className="w-3 h-3" /> SLA Breach
                      </span>
                    )}
                    
                    {issue.status === "OPEN" && !!issue.logs?.suggestedAssigneeId && (
                      <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                        Pending Approval
                      </span>
                    )}
                    <span className="text-[10px] text-zinc-600">{issue.timeAgo}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2 shrink-0">
                <span className={cn(
                  "px-2 py-0.5 rounded-md border text-[10px] font-semibold",
                  severityColor[issue.severity] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
                )}>
                  {issue.severity}
                </span>
                
                <span className={cn(
                  "px-2 py-0.5 rounded-md border text-[10px] font-semibold",
                  statusColor[issue.status || "OPEN"] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20"
                )}>
                  {issue.status ? issue.status.replace("_", " ") : "UNKNOWN"}
                </span>

                {/* Actions */}
                {onAssignClick && issue.status === "OPEN" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onAssignClick(issue); }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-500 transition-all"
                  >
                    Assign
                  </button>
                )}
                {onStatusChange && issue.status === "ASSIGNED" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "IN_PROGRESS"); }}
                    className="px-3 py-1 bg-teal-600 text-white rounded-lg text-[10px] font-semibold hover:bg-teal-500 transition-all"
                  >
                    Start
                  </button>
                )}
                {onStatusChange && issue.status === "IN_PROGRESS" && (
                  <button
                    onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "RESOLVED"); }}
                    className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-500 transition-all"
                  >
                    Resolve
                  </button>
                )}

                <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
