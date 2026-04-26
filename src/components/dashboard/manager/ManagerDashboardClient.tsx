"use client";

import { useState } from "react";
import { AlertTriangle, CheckCircle, Users, FolderKanban, Plus, Loader2, X, Zap, Terminal, ShieldAlert } from "lucide-react";
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
    { title: "LIVE_INCIDENTS", value: openIssuesCount, icon: AlertTriangle, color: "text-black", bgClass: "bg-[#FFD700]" },
    { title: "STABILIZED_24H", value: resolvedTodayCount, icon: CheckCircle, color: "text-black", bgClass: "bg-[#32CD32]" },
    { title: "SECTOR_TEAMS", value: teams.length, icon: FolderKanban, color: "text-black", bgClass: "bg-[#00D1FF]" },
    { title: "OPERATORS", value: developerCount, icon: Users, color: "text-white", bgClass: "bg-[#FF00FF]" },
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
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-16 pb-24 max-w-[1600px] mx-auto">
      {/* ── MASSIVE HEADER BOARD ── */}
      <div className="relative group p-1 bg-black border-4 border-black shadow-[16px_16px_0_0_black]">
        <div className="bg-white border-4 border-black p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Corner Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D1FF] border-l-4 border-b-4 border-black -mr-16 -mt-16 rotate-45 group-hover:rotate-0 transition-transform duration-500"></div>

          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
            <div className="space-y-8 max-w-3xl">
              <div className="flex flex-wrap gap-4">
                <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFD700]" /> SYSTEM_NODE: {managerEmail.split("@")[0].toUpperCase()}_MGR
                </span>
                <span className="bg-[#FFD700] border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] shadow-[4px_4px_0_0_black]">
                  SECTOR: MANAGER_OVERRIDE
                </span>
              </div>

              <h1 className="text-5xl md:text-8xl font-[900] tracking-tighter uppercase italic leading-none text-black break-words">
                {project.name} <br />
                <span className="bg-black text-white px-6 inline-block mt-4 -rotate-1 skew-x-3 group-hover:rotate-0 group-hover:skew-x-0 transition-all duration-300">
                  CONTROL_OPS_
                </span>
              </h1>

              <div className="flex items-center gap-6 p-6 bg-[#F8F8F8] border-l-8 border-black text-black">
                <Terminal className="w-10 h-10 shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest opacity-60 leading-tight">
                  {project.description || "No operational description provided for this project node."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsCreateIssueOpen(true)}
              className="w-full xl:w-auto h-24 px-12 bg-[#FFD700] text-black border-4 border-black font-[900] text-2xl uppercase italic tracking-tighter hover:bg-black hover:text-white shadow-[12px_12px_0_0_black] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all flex items-center justify-center gap-6 active:scale-95 group"
            >
              <Plus className="w-10 h-10 stroke-[4px] group-hover:rotate-90 transition-transform" />
              <span>INIT_MANUAL_LOG</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS BOARD ── */}
      <div className="bg-black border-4 border-black p-1 shadow-[20px_20px_0_0_#FFD700]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-black">
          {stats.map((stat, idx) => (
            <div key={stat.title} className="bg-white p-2">
              <StatCard index={idx} {...stat} />
            </div>
          ))}
        </div>
      </div>

      {/* ── MAIN CONTENT GRID ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Recent Issues */}
        <div className="lg:col-span-2">
          {recentIssues.length === 0 ? (
            <div className="p-20 border-4 border-black border-dashed bg-white text-center shadow-[12px_12px_0_0_#F0F0F0]">
              <ShieldAlert className="w-12 h-12 text-black/10 mx-auto mb-4" />
              <p className="text-2xl font-black uppercase italic opacity-20">STREAM_CLEAR: NO_INCIDENTS_DETECTED</p>
            </div>
          ) : (
            <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_black]">
              <RecentIssues issues={recentIssues} onAssignClick={handleAssignClick} />
            </div>
          )}
        </div>

        {/* Teams Panel */}
        <div className="space-y-8">
          {/* Teams Header */}
          <div className="p-8 border-4 border-black bg-white shadow-[12px_12px_0_0_black] space-y-6">
            <div className="flex items-center justify-between border-b-4 border-black pb-6">
              <h2 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-3">
                <FolderKanban className="w-7 h-7" /> SECTOR_NODES
              </h2>
              <button
                onClick={() => setShowCreateTeam(true)}
                className="flex items-center gap-1.5 text-[10px] px-4 py-2 border-2 border-black bg-[#FFD700] text-black font-black uppercase tracking-widest hover:bg-black hover:text-white shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3px]" /> NEW_TEAM
              </button>
            </div>

            {/* Create Team Form (inline) */}
            {showCreateTeam && (
              <div className="p-6 border-4 border-black bg-[#F0F0F0] space-y-4 animate-in fade-in duration-200 shadow-[6px_6px_0_0_black]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-black uppercase tracking-widest">CREATE_TEAM_NODE</p>
                  <button onClick={() => { setShowCreateTeam(false); setCreateError(""); }} className="p-1 border-2 border-black hover:bg-black hover:text-white transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {createError && (
                  <p className="text-[10px] font-black uppercase text-[#FF3131] bg-[#FF3131]/10 border-2 border-[#FF3131] px-3 py-2">{createError}</p>
                )}
                <form onSubmit={handleCreateTeam} className="flex gap-3">
                  <input
                    type="text"
                    required
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="BACKEND_TEAM"
                    className="flex-1 px-4 py-3 text-sm bg-white border-4 border-black font-bold uppercase focus:outline-none focus:bg-[#00D1FF] transition-colors placeholder:text-black/20"
                  />
                  <button
                    type="submit"
                    disabled={creating}
                    className="px-4 py-3 bg-black text-white border-4 border-black font-black text-xs uppercase tracking-widest hover:bg-[#FFD700] hover:text-black disabled:opacity-50 shadow-[4px_4px_0_0_#FFD700] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                  >
                    {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : "DEPLOY"}
                  </button>
                </form>
              </div>
            )}

            {/* Teams List */}
            {teams.length === 0 ? (
              <div className="py-16 text-center border-4 border-black border-dashed bg-[#F8F8F8]">
                <p className="text-lg font-black uppercase italic opacity-20 tracking-widest">NO_SECTOR_NODES_FOUND</p>
              </div>
            ) : (
              <div className="space-y-3">
                {teams.map((team) => (
                  <div key={team.id} className="group relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                    <div className="p-4 bg-white border-4 border-black flex items-center justify-between hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#00D1FF] border-2 border-black flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform shrink-0">
                          <FolderKanban className="w-4 h-4 text-black" />
                        </div>
                        <span className="text-sm font-black uppercase tracking-tighter">{team.name}</span>
                      </div>
                      <span className="text-[10px] font-black px-3 py-1 border-2 border-black bg-[#FFD700] text-black uppercase tracking-widest">
                        {team.issueCount}_OPEN
                      </span>
                    </div>
                  </div>
                ))}
              </div>
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
            } catch (err) {
              alert(err instanceof Error ? err.message : "Failed to assign issue");
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
