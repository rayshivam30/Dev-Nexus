"use client";

import { Zap } from "lucide-react";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { useRouter } from "next/navigation";

export function DeveloperResolvedClient({ resolvedIssues }: { resolvedIssues: Issue[] }) {
  const router = useRouter();

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1">
            Archived Logs
          </span>
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
            <Zap className="w-3 h-3" /> Stabilized Nodes
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Resolved Incidents
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Historical record of all incidents successfully resolved by you.
        </p>
      </div>

      <div className="p-6 border border-white/[0.06] bg-[#0a0a0c]/50 rounded-2xl">
        <RecentIssues 
          issues={resolvedIssues} 
          onRowClick={(issue) => router.push(`/dashboard/developer/issues/${issue.id}`)} 
        />
      </div>
    </div>
  );
}
