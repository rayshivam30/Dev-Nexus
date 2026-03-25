"use client";

import { AlertTriangle, CheckCircle, Clock, Activity, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { CreateIssueModal, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);


  async function handleStatusChange(issueId: string, newStatus: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }

  }

  const stats = [
    { title: "Assigned to Me", value: openCount + inProgressCount, icon: AlertTriangle, color: "text-amber-500", bgClass: "bg-amber-500/10" },
    { title: "In Progress", value: inProgressCount, icon: Activity, color: "text-blue-500", bgClass: "bg-blue-500/10" },
    { title: "Resolved by Me", value: resolvedCount, icon: CheckCircle, color: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { title: "Pending Review", value: openCount, icon: Clock, color: "text-purple-500", bgClass: "bg-purple-500/10" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Developer Overview
          </h1>
          <p className="text-foreground/60 mt-1">
            Team: <span className="font-semibold text-foreground">{teamName || "Not assigned to a team"}</span>
            {" · "}Logged in as <span className="font-mono text-sm">{developerEmail}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="bg-foreground text-background px-4 py-2 mt-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Issue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      <div>
        <h2 className="text-xl font-semibold text-white mb-4">My Assigned Issues</h2>
        {recentIssues.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
            <p className="font-semibold text-foreground">All clear!</p>
            <p className="text-sm text-foreground/50 mt-1">No issues are currently assigned to you.</p>
          </div>
        ) : (
          <RecentIssues issues={recentIssues} onStatusChange={handleStatusChange} onRowClick={(issue) => setViewingIssue(issue)} />
        )}
      </div>

      <CreateIssueModal 
        isOpen={isCreateIssueOpen} 
        onClose={() => setIsCreateIssueOpen(false)} 
        onSuccess={() => router.refresh()}
        fixedProjectId={projectId || undefined}
        fixedTeamId={teamId || undefined}
        developers={allDevelopers}
      />

      {viewingIssue && (
        <IssueDetailModal
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
          allowAssign={false}
        />
      )}
    </div>
  );
}
