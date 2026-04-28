"use client";

import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useState } from "react";
import { AlertTriangle, ArrowRight } from "lucide-react";

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
  Critical: "bg-red-500", CRITICAL: "bg-red-500",
  High: "bg-orange-500", HIGH: "bg-orange-500",
  Medium: "bg-amber-500", MEDIUM: "bg-amber-500",
  Low: "bg-zinc-500", LOW: "bg-zinc-500",
};

interface AdminIssuesClientProps {
  issues: Issue[];
  teams: TeamData[];
  developers: DeveloperData[];
}

export function AdminIssuesClient({ issues }: AdminIssuesClientProps) {
  const router = useRouter();
  const [lastNotification, setLastNotification] = useState<string | null>(null);

  useNotifications(
    (data) => {
      setLastNotification(`New incident: ${data.title}`);
      setTimeout(() => setLastNotification(null), 5000);
    },
    (data) => {
      setLastNotification(`Updated: ${data.title}`);
      setTimeout(() => setLastNotification(null), 5000);
    }
  );

  return (
    <div className="space-y-3 relative">
      {/* Real-time Toast Notification */}
      {lastNotification && (
        <div className="fixed top-6 right-6 z-[100] animate-in slide-in-from-right-8 duration-300">
           <div className="bg-[#0a0a0c] border border-emerald-500/30 rounded-xl p-4 shadow-xl flex items-center gap-3">
              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-sm font-medium text-white">{lastNotification}</p>
           </div>
        </div>
      )}

      {issues.map((issue) => (
        <div
          key={issue.id}
          onClick={() => router.push(`/dashboard/admin/issues/${issue.id}`)}
          className="group cursor-pointer p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className={cn("w-2 h-2 rounded-full mt-2 flex-shrink-0", severityDot[issue.severity] || "bg-zinc-500")} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-emerald-400 transition-colors">{issue.title}</p>
                <p className="text-xs text-zinc-600 truncate mt-0.5">{issue.description}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {issue.team?.name && (
                    <span className="text-[10px] font-medium bg-white/[0.03] text-zinc-400 border border-white/[0.06] px-2 py-0.5 rounded-md">
                      {issue.team.name}
                    </span>
                  )}
                  {issue.assignedTo?.email && (
                    <span className="text-[10px] font-medium text-zinc-600">
                      {issue.assignedTo.email}
                    </span>
                  )}
                  {issue.environment && (
                    <span className="text-[10px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md">
                      {issue.environment}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-semibold", severityColor[issue.severity] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20")}>
                {issue.severity}
              </span>
              <span className={cn("px-2 py-0.5 rounded-md border text-[10px] font-semibold", statusColor[issue.status || "OPEN"] || "text-zinc-400 bg-zinc-400/10 border-zinc-400/20")}>
                {issue.status?.replace("_", " ")}
              </span>
              <ArrowRight className="w-4 h-4 text-zinc-700 group-hover:text-zinc-400 transition-colors" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
