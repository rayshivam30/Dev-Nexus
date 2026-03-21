"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Users, FolderKanban, Plus, Loader2, X } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { CreateIssueModal, DeveloperData, TeamData } from "@/components/dashboard/shared/CreateIssueModal";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { useRouter } from "next/navigation";

interface TeamSummary {
  id: string;
  name: string;
  issueCount: number;
}

interface Project {
  id: string;
  name: string;
  description: string;
}

interface ManagerDashboardClientProps {
  managerEmail: string;
  project: Project;
  openIssuesCount: number;
  resolvedTodayCount: number;
  developerCount: number;
  recentIssues: Issue[];
  teams: (TeamSummary & { projectId: string })[];
  allDevelopers: DeveloperData[];
}

export function ManagerDashboardClient({
  managerEmail,
  project,
  openIssuesCount,
  resolvedTodayCount,
  developerCount,
  recentIssues,
  teams,
  allDevelopers,
}: ManagerDashboardClientProps) {
  const router = useRouter();
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  const [assigningIssue, setAssigningIssue] = useState<Issue | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);

  function handleAssignClick(issue: Issue) {
    setAssigningIssue(issue);
  }

  const stats = [
    { title: "Open Issues", value: openIssuesCount, icon: AlertTriangle, color: "text-amber-500", bgClass: "bg-amber-500/10" },
    { title: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle, color: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { title: "Teams", value: teams.length, icon: FolderKanban, color: "text-blue-500", bgClass: "bg-blue-500/10" },
    { title: "Developers", value: developerCount, icon: Users, color: "text-purple-500", bgClass: "bg-purple-500/10" },
  ];

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: teamName, projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");
      setTeamName("");
      setShowCreateTeam(false);
      router.refresh();
    } catch (err: any) {
      setCreateError(err.message);
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-2 text-xs text-foreground/40 mb-1 font-mono uppercase tracking-wide">
            <FolderKanban className="w-3.5 h-3.5" /> My Project
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-foreground/60 mt-1">{project.description}</p>
          )}
          <p className="text-xs text-foreground/40 mt-2 font-mono">Logged in as {managerEmail}</p>
        </div>
        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="bg-foreground text-background px-4 py-2 mt-4 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Issues */}
        <div className="lg:col-span-2">
          {recentIssues.length === 0 ? (
            <div className="p-8 text-center text-foreground/50 border border-border rounded-xl h-full flex flex-col items-center justify-center">
              No recent issues under your project.
            </div>
          ) : (
            <RecentIssues issues={recentIssues} onAssignClick={handleAssignClick} />
          )}
        </div>

        {/* Teams Panel */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Teams</h2>
            <button
              onClick={() => setShowCreateTeam(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" /> New Team
            </button>
          </div>

          {/* Create Team Form (inline) */}
          {showCreateTeam && (
            <div className="p-4 border border-border rounded-xl bg-card space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Create Team</p>
                <button onClick={() => { setShowCreateTeam(false); setCreateError(""); }} className="text-foreground/40 hover:text-foreground transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              {createError && (
                <p className="text-xs text-destructive">{createError}</p>
              )}
              <form onSubmit={handleCreateTeam} className="flex gap-2">
                <input
                  type="text"
                  required
                  value={teamName}
                  onChange={(e) => setTeamName(e.target.value)}
                  placeholder="e.g. Backend Team"
                  className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                />
                <button
                  type="submit"
                  disabled={creating}
                  className="px-3 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add"}
                </button>
              </form>
            </div>
          )}

          {/* Teams List */}
          <div className="rounded-xl border border-border bg-card overflow-hidden divide-y divide-border">
            {teams.length === 0 ? (
              <div className="p-6 text-center text-foreground/50 text-sm">
                No teams yet. Create your first team above.
              </div>
            ) : (
              teams.map((team) => (
                <div key={team.id} className="p-3.5 flex items-center justify-between hover:bg-accent/40 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-sm font-medium">{team.name}</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-foreground/10 text-foreground/60">
                    {team.issueCount} open
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {assigningIssue && (
        <IssueDetailModal
          issue={assigningIssue}
          onClose={() => setAssigningIssue(null)}
          allowAssign={true}
          teams={teams as TeamData[]}
          developers={allDevelopers}
          onAssignSubmit={async (teamId: string, devId: string) => {
            setIsAssigning(true);
            try {
              const token = localStorage.getItem("incident_token") || "";
              const res = await fetch(`/api/issues/${assigningIssue.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ teamId: teamId || undefined, assignedToId: devId || undefined, status: "ASSIGNED" }),
              });
              if (!res.ok) throw new Error("Failed to assign issue");
              setAssigningIssue(null);
              router.refresh();
            } catch (err: any) {
              alert(err.message);
            } finally {
              setIsAssigning(false);
            }
          }}
          isAssigning={isAssigning}
        />
      )}

      <CreateIssueModal 
        isOpen={isCreateIssueOpen} 
        onClose={() => setIsCreateIssueOpen(false)} 
        onSuccess={() => router.refresh()}
        fixedProjectId={project.id}
        teams={teams as TeamData[]}
        developers={allDevelopers}
      />
    </div>
  );
}
