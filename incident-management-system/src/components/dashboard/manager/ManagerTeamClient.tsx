"use client";

import { useState } from "react";
import { Plus, Loader2, X, Users, AlertCircle, Activity, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { ManagerTeamNode } from "./ManagerTeamNode";

interface TeamMember {
  id: string;
  email: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  issueCount: number;
  members: TeamMember[];
}

interface ManagerTeamClientProps {
  projectId: string;
  projectName: string;
  teams: Team[];
}

export function ManagerTeamClient({ projectId, projectName, teams }: ManagerTeamClientProps) {
  const router = useRouter();

  // Create Team
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamName, setTeamName] = useState("");
  const [teamLoading, setTeamLoading] = useState(false);
  const [teamError, setTeamError] = useState("");

  const [expandedTeam, setExpandedTeam] = useState<string | null>(teams[0]?.id ?? null);

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setTeamError("");
    setTeamLoading(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ name: teamName, projectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setTeamName("");
      setShowCreateTeam(false);
      router.refresh();
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Failed to create team");
    } finally {
      setTeamLoading(false);
    }
  }



  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Team Management
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Project <span className="text-zinc-300 font-medium">{projectName}</span> — manage sector teams and operator access.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateTeam(true); setTeamError(""); }}
          className="flex items-center gap-2 h-11 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all shrink-0"
        >
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateTeam && (
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 space-y-6 animate-in fade-in duration-200 backdrop-blur-xl">
          <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Layers className="w-5 h-5 text-emerald-400" /> Deploy Team
            </h2>
            <button
              onClick={() => setShowCreateTeam(false)}
              className="p-2 rounded-lg hover:bg-white/[0.06] text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          {teamError && (
            <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-4 py-3 rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {teamError}
            </p>
          )}
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="Backend Team"
              className="flex-1 px-4 py-3 bg-black border border-white/[0.1] rounded-xl text-sm focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-600"
            />
            <button
              type="submit"
              disabled={teamLoading}
              className="px-6 py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              {teamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Team"}
            </button>
          </form>
        </div>
      )}

      {/* Teams — each is an expandable card */}
      {teams.length === 0 ? (
        <div className="p-12 border border-white/[0.06] rounded-2xl bg-white/[0.01] text-center space-y-4">
          <Users className="w-12 h-12 text-zinc-600 mx-auto" />
          <p className="text-xl font-bold text-zinc-400">No teams initialized</p>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="mt-4 text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
          >
            Create your first team
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <ManagerTeamNode
              key={team.id}
              team={team}
              projectId={projectId}
              isExpanded={expandedTeam === team.id}
              onToggleExpand={() => setExpandedTeam(expandedTeam === team.id ? null : team.id)}
            />
          ))}
        </div>
      )}

      {/* System Note */}
      <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.04] text-center space-y-4">
        <Activity className="w-8 h-8 text-emerald-400/50 mx-auto" />
        <p className="text-xs font-medium text-zinc-500 max-w-lg mx-auto leading-relaxed">
          Teams sync in real-time. Role-based access controls apply to operator records.
        </p>
      </div>
    </div>
  );
}
