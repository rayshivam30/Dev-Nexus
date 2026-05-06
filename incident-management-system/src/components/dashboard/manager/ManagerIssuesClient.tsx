"use client";

import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldAlert, Activity } from "lucide-react";

interface ManagerIssuesClientProps {
  initialIssues: Issue[];
  teams: unknown[];
  allDevelopers: unknown[];
}

export function ManagerIssuesClient({ initialIssues, teams, allDevelopers }: ManagerIssuesClientProps) {
  const router = useRouter();
  void teams;
  void allDevelopers;

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Issues Directory
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            All active incident logs within your project&apos;s sector teams.
          </p>
        </div>
        <div className="flex items-center gap-3 px-4 py-2 border border-white/[0.06] bg-white/[0.02] rounded-xl">
          <Activity className="w-4 h-4 text-emerald-400" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Total {initialIssues.length} Logs
          </span>
        </div>
      </div>

      {/* ── ISSUES TABLE ── */}
      {initialIssues.length === 0 ? (
        <div className="p-12 border border-white/[0.06] rounded-2xl bg-white/[0.01] text-center">
          <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-xl font-bold text-zinc-400">No active incidents</p>
          <p className="text-sm text-zinc-500 mt-2">All sectors reporting nominal operations.</p>
        </div>
      ) : (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col">
          <div className="flex items-center gap-3 p-6 border-b border-white/[0.06]">
            <AlertCircle className="w-5 h-5 text-zinc-400" />
            <span className="text-sm font-semibold text-zinc-200">Active Incident Registry</span>
            <span className="ml-auto text-xs font-medium bg-white/[0.06] text-zinc-300 px-2.5 py-1 rounded-md">
              {initialIssues.length} Total
            </span>
          </div>
          <div className="p-6">
            <RecentIssues
              issues={initialIssues}
              onRowClick={(issue) => router.push(`/dashboard/manager/issues/${issue.id}`)}
              onAssignClick={(issue) => router.push(`/dashboard/manager/issues/${issue.id}`)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
