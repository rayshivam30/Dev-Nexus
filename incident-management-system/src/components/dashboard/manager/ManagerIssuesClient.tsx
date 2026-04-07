"use client";

import { useState } from "react";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { IssueDetailModal, TeamData, DeveloperData } from "@/components/dashboard/shared/IssueDetailModal";
import { useRouter } from "next/navigation";
import { AlertCircle, ShieldAlert, Activity } from "lucide-react";

interface ManagerIssuesClientProps {
  initialIssues: Issue[];
  teams: TeamData[];
  allDevelopers: DeveloperData[];
}

export function ManagerIssuesClient({ initialIssues, teams, allDevelopers }: ManagerIssuesClientProps) {
  const router = useRouter();
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  async function handleAssignSubmit(teamId: string, devId: string) {
    if (!selectedIssue) return;
    setIsAssigning(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${selectedIssue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ teamId: teamId || undefined, assignedToId: devId || undefined, status: "ASSIGNED" }),
      });
      if (!res.ok) {
        throw new Error("Failed to assign issue");
      }
      setSelectedIssue(null);
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to assign issue");
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, rootCause: rootCause || undefined }),
      });
      if (!res.ok) throw new Error("Failed to update status");
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  return (
    <div className="space-y-16 pb-24 max-w-[1600px] mx-auto">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter uppercase italic leading-none border-l-8 border-black pl-8">
            ISSUE <br />
            <span className="bg-[#FF3131] text-white border-4 border-black px-4 shadow-[6px_6px_0_0_black] inline-block mt-2">LOG_STREAM</span>
          </h1>
          <p className="text-black font-black uppercase text-xs tracking-widest mt-4 opacity-60 max-w-xl border-b-2 border-black/10 pb-4">
            All active incident logs within your project&apos;s sector teams.
          </p>
        </div>
        <div className="flex items-center gap-3 px-6 py-4 border-4 border-black bg-[#FFD700] shadow-[6px_6px_0_0_black]">
          <Activity className="w-5 h-5 text-black" />
          <span className="text-xs font-black uppercase tracking-widest">
            TOTAL_{initialIssues.length}_LOGS
          </span>
        </div>
      </div>

      {/* ── ISSUES TABLE ── */}
      {initialIssues.length === 0 ? (
        <div className="p-20 border-4 border-black border-dashed bg-white text-center shadow-[12px_12px_0_0_#F0F0F0]">
          <ShieldAlert className="w-12 h-12 text-black/10 mx-auto mb-4" />
          <p className="text-2xl font-black uppercase italic opacity-20">STREAM_CLEAR: NO_INCIDENT_LOGS_DETECTED</p>
          <p className="text-xs font-black uppercase opacity-10 mt-2 tracking-widest">All sectors reporting nominal operations.</p>
        </div>
      ) : (
        <div className="bg-white border-4 border-black shadow-[12px_12px_0_0_black]">
          <div className="flex items-center gap-4 p-6 border-b-4 border-black bg-[#F0F0F0]">
            <AlertCircle className="w-6 h-6" />
            <span className="text-xs font-black uppercase tracking-[0.2em]">ACTIVE_INCIDENT_REGISTRY</span>
            <span className="ml-auto text-[10px] font-black bg-black text-white px-3 py-1 uppercase tracking-widest">
              TOTAL_{initialIssues.length}
            </span>
          </div>
          <div className="p-6">
            <RecentIssues
              issues={initialIssues}
              onRowClick={(issue) => setSelectedIssue(issue)}
              onAssignClick={(issue) => setSelectedIssue(issue)}
            />
          </div>
        </div>
      )}

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          allowAssign={true}
          teams={teams}
          developers={allDevelopers}
          onAssignSubmit={handleAssignSubmit}
          onStatusChange={handleStatusChange}
          isAssigning={isAssigning}
        />
      )}
    </div>
  );
}
