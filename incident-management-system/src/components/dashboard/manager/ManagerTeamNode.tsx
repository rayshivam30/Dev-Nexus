import { useState } from "react";
import { Users, ChevronUp, ChevronDown, UserPlus, X, Loader2, Copy, Check } from "lucide-react";
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

interface ManagerTeamNodeProps {
  team: Team;
  projectId: string;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export function ManagerTeamNode({ team, projectId, isExpanded, onToggleExpand }: ManagerTeamNodeProps) {
  const [inviting, setInviting] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteLink, setInviteLink] = useState("");
  const [copiedTeam, setCopiedTeam] = useState(false);

  async function handleInviteDeveloper(e: React.FormEvent) {
    e.preventDefault();
    setInviteError("");
    setInviteLink("");
    setInviteLoading(true);
    try {
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail || "", role: "DEVELOPER", projectId, teamId: team.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLink(data.inviteLink);
      setInviteEmail("");
    } catch (err) {
      setInviteError(err instanceof Error ? err.message : "Failed to invite developer");
    } finally {
      setInviteLoading(false);
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(inviteLink || "");
    setCopiedTeam(true);
    setTimeout(() => setCopiedTeam(false), 2000);
  }

  return (
    <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl overflow-hidden transition-all hover:border-white/[0.1]">
      {/* Team Header */}
      <button
        onClick={onToggleExpand}
        className="w-full p-6 flex items-center justify-between hover:bg-white/[0.02] transition-colors border-b border-white/[0.06]"
      >
        <div className="flex items-center gap-4">
          <div className={cn(
            "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
            isExpanded ? "bg-emerald-500/10 text-emerald-400" : "bg-white/[0.04] text-zinc-400"
          )}>
            <Users className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg text-white">{team.name}</p>
            <p className="text-xs font-medium text-zinc-500 mt-1">
              {team.members.length} Operators · {team.issueCount} Open Logs
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-white/[0.06] text-zinc-300 hidden md:inline">
            ID: {team.id.slice(0, 6)}
          </span>
          {isExpanded ? <ChevronUp className="w-5 h-5 text-zinc-400" /> : <ChevronDown className="w-5 h-5 text-zinc-400" />}
        </div>
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="divide-y divide-white/[0.06]">
          {/* Members list */}
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Operator Roster</span>
            </div>
            {team.members.length === 0 ? (
              <div className="py-8 text-center bg-white/[0.01] rounded-xl border border-white/[0.04]">
                <p className="text-sm font-medium text-zinc-500">No operators assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {team.members.map((m) => (
                  <div key={m.id} className="p-4 bg-white/[0.03] border border-white/[0.06] rounded-xl flex items-center justify-between hover:bg-white/[0.05] transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-sm font-bold text-emerald-400 shrink-0">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-zinc-200 truncate">{m.email.split('@')[0]}</p>
                        <p className="text-xs text-zinc-500 truncate">{m.email}</p>
                      </div>
                    </div>
                    <div className={cn(
                      "w-2 h-2 rounded-full shrink-0",
                      m.status === "ACTIVE" ? "bg-emerald-500" : "bg-zinc-600"
                    )} title={m.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Invite Developer to this team */}
          <div className="p-6 bg-black/20 space-y-4">
            {!inviting ? (
              <button
                onClick={() => setInviting(true)}
                className="flex items-center gap-2 text-xs px-4 py-2 bg-white/[0.06] hover:bg-white/[0.1] text-white rounded-lg transition-colors font-medium"
              >
                <UserPlus className="w-4 h-4" /> Invite Operator to {team.name}
              </button>
            ) : (
              <div className="space-y-4 animate-in fade-in duration-200 bg-white/[0.03] p-5 rounded-xl border border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-zinc-300">
                    Invite to <span className="text-white">{team.name}</span>
                  </p>
                  <button
                    onClick={() => { setInviting(false); setInviteError(""); setInviteLink(""); }}
                    className="p-1.5 rounded-lg hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {inviteError && (
                  <p className="text-xs font-medium text-red-400 bg-red-400/10 border border-red-400/20 px-3 py-2 rounded-lg">
                    {inviteError}
                  </p>
                )}
                <form onSubmit={handleInviteDeveloper} className="flex gap-3">
                  <input
                    type="email"
                    required
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="operator@domain.com"
                    className="flex-1 px-4 py-2.5 text-sm bg-black border border-white/[0.1] rounded-lg focus:outline-none focus:border-white/20 transition-colors placeholder:text-zinc-600"
                  />
                  <button
                    type="submit"
                    disabled={inviteLoading}
                    className="px-5 py-2.5 bg-white text-black font-semibold text-xs rounded-lg hover:bg-zinc-200 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[100px]"
                  >
                    {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Transmit"}
                  </button>
                </form>

                {inviteLink && (
                  <div className="mt-4 bg-black border border-white/[0.1] rounded-lg p-3 flex items-center gap-3">
                    <div className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md shrink-0">
                      Link Generated
                    </div>
                    <input
                      readOnly
                      value={inviteLink}
                      className="flex-1 text-sm font-mono bg-transparent text-zinc-300 focus:outline-none truncate"
                    />
                    <button
                      onClick={copyLink}
                      className="shrink-0 p-2 rounded-md bg-white/[0.06] hover:bg-white/[0.1] text-zinc-300 transition-colors"
                    >
                      {copiedTeam ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
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
}
