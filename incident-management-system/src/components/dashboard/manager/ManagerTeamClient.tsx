"use client";

import { useState } from "react";
import { Plus, Loader2, X, Users, AlertCircle, ChevronDown, ChevronUp, UserPlus, Copy, Check } from "lucide-react";
import { useRouter } from "next/navigation";

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
    } catch (err: any) {
      setTeamError(err.message);
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
        // Pass teamId so developer is linked to this specific team on accept
        body: JSON.stringify({ email: inviteEmails[teamId] || "", role: "DEVELOPER", projectId, teamId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLinks((p) => ({ ...p, [teamId]: data.inviteLink }));
      setInviteEmails((p) => ({ ...p, [teamId]: "" }));
    } catch (err: any) {
      setInviteErrors((p) => ({ ...p, [teamId]: err.message }));
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
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-foreground/60 mt-1">
            Project: <span className="font-semibold text-foreground">{projectName}</span>
          </p>
        </div>
        <button
          onClick={() => { setShowCreateTeam(true); setTeamError(""); }}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-md bg-foreground text-background font-medium hover:opacity-90 transition-opacity shrink-0"
        >
          <Plus className="w-4 h-4" /> New Team
        </button>
      </div>

      {/* Create Team Form */}
      {showCreateTeam && (
        <div className="p-5 border border-border rounded-xl bg-card space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <p className="font-semibold">Create a Team</p>
            <button onClick={() => setShowCreateTeam(false)} className="text-foreground/40 hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {teamError && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="w-3 h-3" />{teamError}</p>}
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
              disabled={teamLoading}
              className="px-4 py-2 bg-foreground text-background rounded-md text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {teamLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}
            </button>
          </form>
        </div>
      )}

      {/* Teams — each is an expandable card */}
      {teams.length === 0 ? (
        <div className="rounded-xl border border-border bg-card p-16 text-center space-y-2">
          <Users className="w-8 h-8 text-foreground/30 mx-auto" />
          <p className="font-semibold text-foreground/60">No teams yet</p>
          <p className="text-sm text-foreground/40">Click <span className="font-semibold text-foreground">+ New Team</span> to create your first team.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => {
            const isExpanded = expandedTeam === team.id;
            const inviting = activeInviteTeam === team.id;
            return (
              <div key={team.id} className="rounded-xl border border-border bg-card overflow-hidden">

                {/* Team Header */}
                <button
                  onClick={() => setExpandedTeam(isExpanded ? null : team.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Users className="w-4 h-4 text-blue-400" />
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-sm">{team.name}</p>
                      <p className="text-xs text-foreground/50">{team.members.length} developers · {team.issueCount} open issues</p>
                    </div>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-foreground/40" /> : <ChevronDown className="w-4 h-4 text-foreground/40" />}
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-border divide-y divide-border">

                    {/* Members list */}
                    {team.members.length === 0 ? (
                      <p className="px-5 py-4 text-sm text-foreground/50">No developers in this team yet.</p>
                    ) : (
                      team.members.map((m) => (
                        <div key={m.id} className="px-5 py-3 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center text-xs font-bold uppercase">
                              {m.email[0]}
                            </div>
                            <span className="text-sm">{m.email}</span>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${m.status === "ACTIVE" ? "text-emerald-500 bg-emerald-500/10" : "text-foreground/40 bg-foreground/10"}`}>
                            {m.status}
                          </span>
                        </div>
                      ))
                    )}

                    {/* Invite Developer to this team */}
                    <div className="px-5 py-4 space-y-3">
                      {!inviting ? (
                        <button
                          onClick={() => setActiveInviteTeam(team.id)}
                          className="flex items-center gap-1.5 text-xs px-3 py-1.5 border border-border rounded-md hover:bg-accent transition-colors"
                        >
                          <UserPlus className="w-3.5 h-3.5" /> Invite Developer to this team
                        </button>
                      ) : (
                        <div className="space-y-2 animate-in fade-in duration-200">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-foreground/70">Invite Developer to <span className="text-foreground">{team.name}</span></p>
                            <button onClick={() => { setActiveInviteTeam(null); setInviteErrors({}); setInviteLinks({}); }} className="text-foreground/40 hover:text-foreground">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                          {inviteErrors[team.id] && (
                            <p className="text-xs text-destructive">{inviteErrors[team.id]}</p>
                          )}
                          <form onSubmit={(e) => handleInviteDeveloper(e, team.id)} className="flex gap-2">
                            <input
                              type="email"
                              required
                              value={inviteEmails[team.id] || ""}
                              onChange={(e) => setInviteEmails((p) => ({ ...p, [team.id]: e.target.value }))}
                              placeholder="developer@company.com"
                              className="flex-1 px-3 py-1.5 text-sm bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground"
                            />
                            <button
                              type="submit"
                              disabled={inviteLoading[team.id]}
                              className="px-3 py-1.5 bg-foreground text-background text-sm rounded-md hover:opacity-90 disabled:opacity-50"
                            >
                              {inviteLoading[team.id] ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Invite"}
                            </button>
                          </form>

                          {inviteLinks[team.id] && (
                            <div className="flex items-center gap-2 p-2 bg-accent/20 rounded-md border border-border">
                              <input readOnly value={inviteLinks[team.id]} className="flex-1 text-xs font-mono bg-transparent focus:outline-none" />
                              <button onClick={() => copyLink(team.id)} className="shrink-0 text-xs px-2 py-1 border border-border rounded hover:bg-accent">
                                {copiedTeam === team.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
