"use client";

import { useState } from "react";
import { Plus, Loader2, X, Users, AlertCircle, ChevronDown, ChevronUp, UserPlus, Copy, Check, Activity, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

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

  // Per-team invite state: keyed by teamId
  const [activeInviteTeam, setActiveInviteTeam] = useState<string | null>(null);
  const [inviteEmails, setInviteEmails] = useState<Record<string, string>>({});
  const [inviteLoading, setInviteLoading] = useState<Record<string, boolean>>({});
  const [inviteLinks, setInviteLinks] = useState<Record<string, string>>({});
  const [inviteErrors, setInviteErrors] = useState<Record<string, string>>({});
  const [copiedTeam, setCopiedTeam] = useState<string | null>(null);

  // Expand/collapse teams
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

  async function handleInviteDeveloper(e: React.FormEvent, teamId: string) {
    e.preventDefault();
    setInviteErrors((p) => ({ ...p, [teamId]: "" }));
    setInviteLinks((p) => ({ ...p, [teamId]: "" }));
    setInviteLoading((p) => ({ ...p, [teamId]: true }));
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: inviteEmails[teamId] || "", role: "DEVELOPER", projectId, teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLinks((p) => ({ ...p, [teamId]: data.inviteLink }));
      setInviteEmails((p) => ({ ...p, [teamId]: "" }));
    } catch (err) {
      setInviteErrors((p) => ({ ...p, [teamId]: err instanceof Error ? err.message : "Failed to invite developer" }));
    } finally {
      setInviteLoading((p) => ({ ...p, [teamId]: false }));
    }
  }

  function copyLink(teamId: string) {
    navigator.clipboard.writeText(inviteLinks[teamId] || "");
    setCopiedTeam(teamId);
    setTimeout(() => setCopiedTeam(null), 2000);
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
          {teams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const inviting = activeInviteTeam === team.id;
            return (
              <div key={team.id} className="group relative">
                <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all"></div>
                <div className="bg-white border-4 border-black overflow-hidden hover:translate-x-0.5 hover:translate-y-0.5 transition-all">

                  {/* Team Header */}
                  <button
                    onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-[#F0F0F0] transition-colors border-b-4 border-black"
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 border-2 border-black flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform",
                        isExpanded ? "bg-[#00D1FF]" : "bg-[#F0F0F0]"
                      )}>
                        <Users className="w-6 h-6 text-black" />
                      </div>
                      <div className="text-left">
                        <p className="font-[900] text-xl uppercase tracking-tighter italic leading-none">{team.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-black/40 mt-1">
                          {team.members.length}_OPERATORS · {team.issueCount}_OPEN_LOGS
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-black px-3 py-1 border-2 border-black bg-[#FFD700] text-black uppercase tracking-widest hidden md:inline">
                        SECTOR_ID: {team.id.slice(0, 6)}
                      </span>
                      {isExpanded
                        ? <ChevronUp className="w-6 h-6 stroke-[3px]" />
                        : <ChevronDown className="w-6 h-6 stroke-[3px]" />
                      }
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="divide-y-4 divide-black">

                      {/* Members list */}
                      <div className="p-6 space-y-4">
                        <div className="flex items-center gap-3 mb-4">
                          <span className="text-[10px] font-black uppercase tracking-widest text-black/40">OPERATOR_ROSTER</span>
                          <span className="text-[10px] font-black bg-black text-white px-2 py-0.5">{team.members.length}</span>
                        </div>
                        {team.members.length === 0 ? (
                          <div className="py-10 text-center border-4 border-dashed border-black bg-[#F8F8F8]">
                            <p className="text-sm font-black uppercase italic opacity-20">NO_OPERATORS_ASSIGNED</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {team.members.map((m) => (
                              <div key={m.id} className="p-4 bg-white border-4 border-black group/member relative">
                                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 group-hover/member:translate-x-0 group-hover/member:translate-y-0 transition-all"></div>
                                <div className="flex items-center justify-between relative z-10">
                                  <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black border-2 border-black flex items-center justify-center text-base font-black text-[#00D1FF] rotate-3 group-hover/member:rotate-0 transition-transform">
                                      {m.email[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                      <p className="text-sm font-black uppercase tracking-tighter leading-none truncate">{m.email.split('@')[0]}</p>
                                      <p className="text-[10px] font-bold text-black/40 truncate italic">{m.email}</p>
                                    </div>
                                  </div>
                                  <div className={cn(
                                    "w-4 h-4 border-2 border-black",
                                    m.status === "ACTIVE" ? "bg-[#32CD32]" : "bg-black"
                                  )} title={m.status} />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Invite Developer to this team */}
                      <div className="p-6 bg-[#F0F0F0] space-y-4">
                        {!inviting ? (
                          <button
                            onClick={() => setActiveInviteTeam(team.id)}
                            className="flex items-center gap-2 text-[10px] px-4 py-3 border-2 border-black bg-white font-black uppercase tracking-widest hover:bg-[#00D1FF] shadow-[4px_4px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                          >
                            <UserPlus className="w-4 h-4 stroke-[2.5px]" /> INVITE_OPERATOR_TO_{team.name.toUpperCase().replace(/ /g, '_')}
                          </button>
                        ) : (
                          <div className="space-y-4 animate-in fade-in duration-200">
                            <div className="flex items-center justify-between">
                              <p className="text-xs font-black uppercase tracking-widest">
                                INVITE_TO: <span className="text-black">{team.name.toUpperCase()}</span>
                              </p>
                              <button
                                onClick={() => { setActiveInviteTeam(null); setInviteErrors({}); setInviteLinks({}); }}
                                className="p-1 border-2 border-black hover:bg-black hover:text-white transition-colors"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            {inviteErrors[team.id] && (
                              <p className="text-[10px] font-black uppercase text-[#FF3131] bg-[#FF3131]/10 border-2 border-[#FF3131] px-3 py-2">
                                {inviteErrors[team.id]}
                              </p>
                            )}
                            <form onSubmit={(e) => handleInviteDeveloper(e, team.id)} className="flex gap-3">
                              <input
                                type="email"
                                required
                                value={inviteEmails[team.id] || ""}
                                onChange={(e) => setInviteEmails((p) => ({ ...p, [team.id]: e.target.value }))}
                                placeholder="OPERATOR@DOMAIN.COM"
                                className="flex-1 px-4 py-3 text-sm bg-white border-4 border-black font-bold uppercase focus:outline-none focus:bg-[#00D1FF] transition-colors placeholder:text-black/20"
                              />
                              <button
                                type="submit"
                                disabled={inviteLoading[team.id]}
                                className="px-6 py-3 bg-black text-white border-4 border-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-black disabled:opacity-50 shadow-[4px_4px_0_0_#FFD700] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                              >
                                {inviteLoading[team.id] ? <Loader2 className="w-4 h-4 animate-spin" /> : "TRANSMIT"}
                              </button>
                            </form>

                            {inviteLinks[team.id] && (
                              <div className="relative">
                                <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                                <div className="relative bg-white border-4 border-black p-4 flex items-center gap-3">
                                  <div className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] shrink-0 bg-[#32CD32]/10 border-2 border-[#32CD32] px-2 py-1">
                                    LINK_GEN
                                  </div>
                                  <input
                                    readOnly
                                    value={inviteLinks[team.id]}
                                    className="flex-1 text-xs font-mono bg-transparent focus:outline-none font-bold truncate"
                                  />
                                  <button
                                    onClick={() => copyLink(team.id)}
                                    className="shrink-0 p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                                  >
                                    {copiedTeam === team.id
                                      ? <Check className="w-4 h-4 text-[#32CD32]" />
                                      : <Copy className="w-4 h-4" />
                                    }
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
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
