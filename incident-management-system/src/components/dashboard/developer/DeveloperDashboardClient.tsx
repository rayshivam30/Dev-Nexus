"use client";

import { AlertTriangle, CheckCircle, Clock, Activity, Plus, Zap } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { CreateIssueModal, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

interface DeveloperDashboardClientProps {
  developerEmail: string;
  teamName: string;
  teamId?: string | null;
  projectId?: string | null;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  recentIssues: Issue[];
  allDevelopers: DeveloperData[];
}

export function DeveloperDashboardClient({
  developerEmail,
  teamName,
  teamId,
  projectId,
  openCount,
  inProgressCount,
  resolvedCount,
  recentIssues,
  allDevelopers,
}: DeveloperDashboardClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);


  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          rootCause: rootCause 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      showToast({
        tone: "success",
        title: newStatus === "RESOLVED" ? "Issue resolved" : "Work started",
        description: newStatus === "RESOLVED" ? "The issue was resolved successfully." : "The issue has moved into progress.",
      });
      router.refresh();
    } catch (err) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update status",
      });
    }
  }

  const stats = [
    { title: "Assigned Tasks", value: openCount + inProgressCount, icon: AlertTriangle, color: "text-amber-400", bgClass: "" },
    { title: "In Progress", value: inProgressCount, icon: Activity, color: "text-blue-400", bgClass: "" },
    { title: "Resolved Nodes", value: resolvedCount, icon: CheckCircle, color: "text-emerald-400", bgClass: "" },
    { title: "Response Pending", value: openCount, icon: Clock, color: "text-rose-400", bgClass: "" },
  ];

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1">
              {teamName || "Global"} Workspace
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Zap className="w-3 h-3" /> Active Session
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Engineer Workspace
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Logged in as {developerEmail}. Monitoring active issue assignments and SLA thresholds.
          </p>
        </div>

        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="flex items-center gap-2 h-11 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all"
        >
          <Plus className="w-4 h-4" /> 
          Log Incident
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 gap-6">
        {recentIssues.length === 0 ? (
          <div className="p-12 border border-white/[0.06] rounded-2xl bg-white/[0.01] text-center">
            <AlertTriangle className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
            <p className="text-xl font-bold text-zinc-400">No active assigned incidents</p>
          </div>
        ) : (
          <div className="p-6 border border-white/[0.06] bg-[#0a0a0c]/50 rounded-2xl">
            <RecentIssues 
              issues={recentIssues} 
              onStatusChange={handleStatusChange} 
              onRowClick={(issue) => router.push(`/dashboard/developer/issues/${issue.id}`)} 
            />
          </div>
        )}
      </div>

      <CreateIssueModal 
        isOpen={isCreateIssueOpen} 
        onClose={() => setIsCreateIssueOpen(false)} 
        onSuccess={() => router.refresh()}
        fixedProjectId={projectId || undefined}
        fixedTeamId={teamId || undefined}
        developers={allDevelopers}
        hideAssignment={true}
      />
    </div>
  );
}
