"use client";

import { useState, useMemo } from "react";
import { AlertTriangle, CheckCircle, Users, FolderKanban, Plus, Loader2, X, Zap, ShieldAlert } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { CreateIssueModal, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

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
  managerEmail: _managerEmail,
  project,
  openIssuesCount,
  resolvedTodayCount,
  developerCount,
  recentIssues,
  teams,
  allDevelopers,
}: ManagerDashboardClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  void _managerEmail;
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  const stats = useMemo(() => [
    { title: "Active Incidents", value: openIssuesCount, icon: AlertTriangle, color: "text-amber-400", bgClass: "" },
    { title: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle, color: "text-emerald-400", bgClass: "" },
    { title: "Sector Teams", value: teams.length, icon: FolderKanban, color: "text-blue-400", bgClass: "" },
    { title: "Operators", value: developerCount, icon: Users, color: "text-purple-400", bgClass: "" },
  ], [openIssuesCount, resolvedTodayCount, teams.length, developerCount]);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreateError("");
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: teamName, projectId: project.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create team");
      setTeamName("");
      setShowCreateTeam(false);
      showToast({
        tone: "success",
        title: "Team created",
        description: "The new team is ready for assignments.",
      });
      router.refresh();
    } catch (err) {
      showToast({
        tone: "error",
        title: "Team creation failed",
        description: err instanceof Error ? err.message : "Failed to create team",
      });
      setCreateError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1">
              {project.name}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Manager Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            {project.description || "No operational description provided."}
          </p>
        </div>

        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="flex items-center gap-2 h-11 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all"
        >
          <Plus className="w-4 h-4" /> 
          Create Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {recentIssues.length === 0 ? (
            <div className="p-12 border border-white/[0.06] rounded-2xl bg-white/[0.01] text-center">
              <ShieldAlert className="w-12 h-12 text-zinc-600 mx-auto mb-4" />
              <p className="text-xl font-bold text-zinc-400">No active incidents</p>
            </div>
          ) : (
            <RecentIssues
              issues={recentIssues}
              onRowClick={(issue) => router.push(`/dashboard/manager/issues/${issue.id}`)}
              onAssignClick={(issue) => router.push(`/dashboard/manager/issues/${issue.id}`)}
            />
          )}
        </div>

        {/* Teams Panel */}
        <div className="space-y-6">
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden flex flex-col h-full max-h-[600px]">
            <div className="p-6 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <FolderKanban className="w-5 h-5 text-zinc-400" /> Sector Teams
              </h2>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" /> New Team
              </button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
              {showCreateTeam && (
                <div className="mb-6 p-4 border border-white/[0.1] bg-white/[0.03] rounded-xl space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Create Team</p>
                    <button onClick={() => { setShowCreateTeam(false); setCreateError(""); }} className="p-1 rounded-md hover:bg-white/10 transition-colors">
                      <X className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                  {createError && (
                    <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">{createError}</p>
                  )}
                  <form onSubmit={handleCreateTeam} className="flex gap-2">
                    <input
                      type="text"
                      required
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      placeholder="Backend Team"
                      className="flex-1 px-3 py-2 text-sm bg-black border border-white/[0.1] rounded-lg focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-600"
                    />
                    <button
                      type="submit"
                      disabled={creating}
                      className="px-4 py-2 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy"}
                    </button>
                  </form>
                </div>
              )}

              {teams.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm font-medium text-zinc-500">No teams found.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 bg-white/[0.02] border border-white/[0.04] rounded-xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                          <FolderKanban className="w-4 h-4 text-blue-400" />
                        </div>
                        <span className="text-sm font-semibold">{team.name}</span>
                      </div>
                      <span className="text-xs font-medium px-2.5 py-1 rounded-md bg-white/[0.06] text-zinc-300">
                        {team.issueCount} Open
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        onSuccess={() => router.refresh()}
        fixedProjectId={project.id}
        teams={teams}
        developers={allDevelopers}
      />
    </div>
  );
}
