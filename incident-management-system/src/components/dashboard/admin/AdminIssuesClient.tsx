"use client";

import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/hooks/use-notifications";
import { useState } from "react";

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
      setLastNotification(`🚨 NEW INCIDENT: ${data.title}`);
      setTimeout(() => setLastNotification(null), 5000);
    },
    (data) => {
      setLastNotification(`🔄 UPDATED: ${data.title}`);
      setTimeout(() => setLastNotification(null), 5000);
    }
  );

  return (
    <div className="grid grid-cols-1 gap-8 relative">
      {/* Real-time Toast Notification */}
      {lastNotification && (
        <div className="fixed top-8 right-8 z-[100] animate-in slide-in-from-right-8 duration-300">
           <div className="bg-[#FF00FF] border-4 border-black p-6 shadow-[8px_8px_0_0_black] flex items-center gap-4">
              <div className="w-4 h-4 bg-white border-2 border-black animate-ping" />
              <p className="text-white font-black uppercase italic tracking-tighter text-sm">
                {lastNotification}
              </p>
           </div>
        </div>
      )}

      {issues.map((issue) => (
        <div
          key={issue.id}
          onClick={() => router.push(`/dashboard/admin/issues/${issue.id}`)}
          className="group cursor-pointer relative"
        >
          <div className="absolute inset-0 bg-[#FF00FF] translate-x-1 translate-y-1 border-2 border-black -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
          <div className="p-6 md:p-8 bg-white border-4 border-black flex flex-col md:flex-row md:items-center md:justify-between gap-6 hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all shadow-[6px_6px_0_0_black]">
            <div className="space-y-4 flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <div className={cn(
                  "w-4 h-4 border-2 border-black shrink-0",
                  issue.severity === 'CRITICAL' ? 'bg-[#FF00FF]' : 'bg-[#FFD700]'
                )} />
                <p className="text-2xl font-[900] text-black tracking-tighter uppercase italic leading-none truncate group-hover:underline decoration-4">
                  {issue.title}
                </p>
              </div>
              <p className="text-xs font-bold text-black/60 line-clamp-1 border-l-2 border-black pl-3">
                {issue.description}
              </p>
              <div className="flex flex-wrap gap-4 text-[10px] font-black uppercase tracking-widest mt-2">
                  <div className="bg-[#00D1FF] text-black px-2 py-0.5 border-2 border-black">TEAM_{issue.team?.name || "MISSING"}</div>
                  {issue.assignedTo?.email && (
                  <div className="bg-black text-white px-2 py-0.5 border-2 border-black">{issue.assignedTo.email}</div>
                  )}
                  {issue.environment && (
                  <div className="bg-[#FFD700] text-black px-2 py-0.5 border-2 border-black">{issue.environment}</div>
                  )}
              </div>
            </div>
            <div className="flex items-center gap-4 shrink-0 justify-end">
              <div className={cn(
                "px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_black]",
                issue.severity === 'CRITICAL' || issue.severity === 'Critical' ? 'bg-[#FF00FF] text-white' : 'bg-white text-black'
              )}>
                {issue.severity}
              </div>
              <div className={cn(
                "px-4 py-2 border-2 border-black font-black uppercase text-xs shadow-[3px_3px_0_0_black]",
                issue.status === 'OPEN' ? 'bg-[#FFD700] text-black' : 'bg-black text-white'
              )}>
                {issue.status?.replace("_", " ")}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
