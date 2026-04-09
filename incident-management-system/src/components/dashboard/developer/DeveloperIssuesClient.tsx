"use client";

import { useRouter } from "next/navigation";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { Zap } from "lucide-react";

export function DeveloperIssuesClient({ issues }: { issues: Issue[] }) {
  const router = useRouter();

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, rootCause }),
      });
      if (res.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-12">
      {/* ── HEADER BOARD ── */}
      <div className="bg-black border-4 border-black p-1 shadow-[12px_12px_0_0_black]">
        <div className="bg-white border-4 border-black p-8 md:p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] border-l-4 border-b-4 border-black rotate-45 -mr-16 -mt-16"></div>
          <div className="relative z-10 space-y-4">
            <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2 w-fit">
              <Zap className="w-4 h-4 text-[#FFD700]" /> ACTIVE_STACK
            </span>
            <h1 className="text-4xl md:text-7xl font-[1000] tracking-tighter uppercase italic leading-none text-black">
              ASSIGNED_INCIDENTS
            </h1>
          </div>
        </div>
      </div>

      <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_black]">
        <RecentIssues 
          issues={issues} 
          onStatusChange={handleStatusChange} 
          onRowClick={(issue) => router.push(`/dashboard/developer/issues/${issue.id}`)} 
        />
      </div>
    </div>
  );
}
