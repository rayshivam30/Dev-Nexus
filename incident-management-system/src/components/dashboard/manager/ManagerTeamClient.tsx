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
    <div className="space-y-16 pb-24 max-w-[1600px] mx-auto">
      {/* ── PAGE HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter uppercase italic leading-none border-l-8 border-black pl-8">
            TEAM <br />
            <span className="bg-[#00D1FF] border-4 border-black px-4 shadow-[6px_6px_0_0_black] inline-block mt-2">RESOURCE_MGMT</span>
          </h1>
          <p className="text-black font-black uppercase text-xs tracking-widest mt-4 opacity-60 max-w-xl border-b-2 border-black/10 pb-4">
            Project: <span className="text-black opacity-100">{projectName}</span> — manage sector nodes and operator access.
          </p>
        </div>
        <button
          onClick={() => { setShowCreateTeam(true); setTeamError(""); }}
          className="bg-[#FFD700] text-black h-16 px-8 border-4 border-black font-[900] text-xl uppercase tracking-tighter hover:bg-black hover:text-white shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-4 active:scale-95 shrink-0"
        >
          <Plus className="w-6 h-6 stroke-[4px]" /> NEW_SECTOR
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateTeam && (
        <div className="bg-white border-8 border-black shadow-[20px_20px_0_0_#00D1FF] p-10 space-y-6 animate-in fade-in duration-200">
          <div className="flex items-center justify-between border-b-4 border-black pb-6">
            <h2 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-3">
              <Layers className="w-7 h-7" /> DEPLOY_TEAM_NODE
            </h2>
            <button
              onClick={() => setShowCreateTeam(false)}
              className="p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
            >
              <X className="w-6 h-6 stroke-[3px]" />
            </button>
          </div>
          {teamError && (
            <p className="text-[10px] font-black uppercase text-[#FF3131] bg-[#FF3131]/10 border-2 border-[#FF3131] px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {teamError}
            </p>
          )}
          <form onSubmit={handleCreateTeam} className="flex gap-4">
            <input
              type="text"
              required
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="BACKEND_SECTOR"
              className="flex-1 px-6 py-4 bg-white border-4 border-black font-bold uppercase text-sm focus:outline-none focus:bg-[#00D1FF] transition-colors placeholder:text-black/20"
            />
            <button
              type="submit"
              disabled={teamLoading}
              className="px-8 py-4 bg-black text-white border-4 border-black font-black text-xs uppercase tracking-widest hover:bg-[#FFD700] hover:text-black disabled:opacity-50 shadow-[6px_6px_0_0_#FFD700] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all flex items-center gap-2"
            >
              {teamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "DEPLOY_NODE"}
            </button>
          </form>
        </div>
      )}

      {/* Teams — each is an expandable card */}
      {teams.length === 0 ? (
        <div className="p-20 border-4 border-black border-dashed bg-white text-center shadow-[12px_12px_0_0_#F0F0F0] space-y-4">
          <Users className="w-12 h-12 text-black/10 mx-auto" />
          <p className="text-2xl font-black uppercase italic opacity-20">VOID_STATE: NO_SECTOR_NODES_INITIALIZED</p>
          <button
            onClick={() => setShowCreateTeam(true)}
            className="mt-4 text-xs font-black uppercase underline underline-offset-4 decoration-2 hover:bg-black hover:text-white px-4 py-2 transition-colors"
          >
            INITIALIZE_FIRST_SECTOR
          </button>
        </div>
      ) : (
        <div className="space-y-8">
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
      <div className="p-10 border-4 border-black bg-black text-white flex flex-col items-center text-center space-y-6 rotate-1 border-dashed">
        <Activity className="w-12 h-12 text-[#FFD700] animate-pulse" />
        <p className="text-xs font-black uppercase tracking-widest opacity-40 leading-relaxed italic">
          &quot;Sector nodes sync in real-time. Unauthorized access to operator records is strictly prohibited under core protocol mandates.&quot;
        </p>
      </div>
    </div>
  );
}
