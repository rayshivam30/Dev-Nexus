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

export function RecentIssues({ issues, onAssignClick, onStatusChange, onRowClick }: RecentIssuesProps) {
  if (issues.length === 0) {
    return (
      <div className="p-12 border-4 border-black border-dashed text-center">
        <p className="text-xl font-black uppercase italic opacity-20">No active incidents captured_</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <h2 className="text-4xl font-[900] tracking-tighter uppercase italic leading-none text-black flex items-center gap-4">
          <div className="w-8 h-8 bg-black"></div>
          RECENT_INCIDENTS
        </h2>
        <span className="text-xs font-black bg-black text-white px-3 py-1">TOTAL_{issues.length}</span>
      </div>

      <div className="space-y-6">
        {issues.map((issue) => (
          <div 
            key={issue.id} 
            onClick={() => onRowClick && onRowClick(issue)}
            className="group cursor-pointer relative"
          >
            <div className="absolute inset-0 bg-[#00D1FF] translate-x-2 translate-y-2 border-4 border-black -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all"></div>
            <div className="p-6 bg-white border-4 border-black flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:-translate-x-1 hover:-translate-y-1 transition-all">
              <div className="flex items-start space-x-6 max-w-full overflow-hidden">
                <div className={cn(
                    "w-6 h-6 border-2 border-black shrink-0 mt-1",
                    issue.severity === 'Critical' || issue.severity === 'CRITICAL' ? 'bg-[#FF00FF] animate-pulse' : 'bg-[#FFD700]'
                )} />
                <div className="min-w-0">
                  <p className="text-2xl font-black text-black leading-tight uppercase italic group-hover:underline decoration-4 truncate">{issue.title}</p>
                  <p className="text-xs font-bold text-black/60 truncate mt-1 w-full max-w-md">
                    {">"} {issue.rootCause || "Log fragment missing..."}
                  </p>
                  
                  <div className="flex items-center gap-3 mt-4">
                    {issue.status === "OPEN" && !!issue.logs?.suggestedAssigneeId && (
                      <span className="text-[10px] bg-[#FFD700] text-black border-2 border-black px-2 py-0.5 font-black uppercase">
                        PENDING_APPROVAL
                      </span>
                    )}
                    <span className="text-[10px] font-black uppercase text-black/40">TIMESTAMP: {issue.timeAgo}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col md:items-end gap-4 shrink-0 w-full md:w-auto">
                <div className="flex flex-wrap items-center gap-3 justify-start md:justify-end">
                  {/* SLA Breach Badge */}
                  {!issue.resolvedAt && (
                    (issue.responseSlaDeadline && new Date(issue.responseSlaDeadline) < new Date() && issue.status === "OPEN") ||
                    (issue.resolutionSlaDeadline && new Date(issue.resolutionSlaDeadline) < new Date() && issue.status !== "RESOLVED")
                  ) && (
                    <span className="flex items-center gap-2 px-3 py-1 bg-[#FF3131] text-white text-[10px] font-black uppercase border-2 border-black shadow-[3px_3px_0_0_black] animate-bounce">
                      <AlertTriangle className="w-3 h-3 stroke-[3px]" /> SLA_BREACH
                    </span>
                  )}
                  
                  <span className={cn(
                    "px-3 py-1 border-2 border-black font-black uppercase text-[10px]",
                    issue.severity === 'Critical' || issue.severity === 'CRITICAL' ? 'bg-[#FF00FF] text-white shadow-[3px_3px_0_0_black]' : 'bg-white text-black shadow-[3px_3px_0_0_black]'
                  )}>
                    {issue.severity}
                  </span>
                  
                  <span className="px-3 py-1 bg-black text-white border-2 border-black font-black uppercase text-[10px] shadow-[3px_3px_0_0_#00D1FF]">
                    {issue.status ? issue.status.replace("_", " ") : "UNKNOWN"}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 w-full md:w-auto">
                  {onAssignClick && issue.status === "OPEN" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onAssignClick(issue); }}
                      className="flex-1 md:flex-none px-4 h-10 bg-[#FFD700] text-black border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      ASSIGN.EXE
                    </button>
                  )}
                  {onStatusChange && issue.status === "ASSIGNED" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "IN_PROGRESS"); }}
                      className="flex-1 md:flex-none px-4 h-10 bg-[#00D1FF] text-black border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      START_WORK
                    </button>
                  )}
                  {onStatusChange && issue.status === "IN_PROGRESS" && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onStatusChange(issue.id, "RESOLVED"); }}
                      className="flex-1 md:flex-none px-4 h-10 bg-[#32CD32] text-black border-2 border-black font-black uppercase text-xs shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      RESOLVE
                    </button>
                  )}
                  <div className="w-10 h-10 flex items-center justify-center border-2 border-black bg-white shadow-[4px_4px_0_0_black] group-hover:bg-black group-hover:text-white transition-colors">
                    <ArrowRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
