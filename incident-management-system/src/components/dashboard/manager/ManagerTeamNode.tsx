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
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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
    <div className="group relative">
      <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all"></div>
      <div className="bg-white border-4 border-black overflow-hidden hover:translate-x-0.5 hover:translate-y-0.5 transition-all">
        {/* Team Header */}
        <button
          onClick={onToggleExpand}
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
            {isExpanded ? <ChevronUp className="w-6 h-6 stroke-[3px]" /> : <ChevronDown className="w-6 h-6 stroke-[3px]" />}
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
                  onClick={() => setInviting(true)}
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
                      onClick={() => { setInviting(false); setInviteError(""); setInviteLink(""); }}
                      className="p-1 border-2 border-black hover:bg-black hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {inviteError && (
                    <p className="text-[10px] font-black uppercase text-[#FF3131] bg-[#FF3131]/10 border-2 border-[#FF3131] px-3 py-2">
                      {inviteError}
                    </p>
                  )}
                  <form onSubmit={handleInviteDeveloper} className="flex gap-3">
                    <input
                      type="email"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="OPERATOR@DOMAIN.COM"
                      className="flex-1 px-4 py-3 text-sm bg-white border-4 border-black font-bold uppercase focus:outline-none focus:bg-[#00D1FF] transition-colors placeholder:text-black/20"
                    />
                    <button
                      type="submit"
                      disabled={inviteLoading}
                      className="px-6 py-3 bg-black text-white border-4 border-black text-[10px] font-black uppercase tracking-widest hover:bg-[#FFD700] hover:text-black disabled:opacity-50 shadow-[4px_4px_0_0_#FFD700] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                    >
                      {inviteLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "TRANSMIT"}
                    </button>
                  </form>

                  {inviteLink && (
                    <div className="relative">
                      <div className="absolute inset-0 bg-black translate-x-1 translate-y-1"></div>
                      <div className="relative bg-white border-4 border-black p-4 flex items-center gap-3">
                        <div className="text-[10px] font-black uppercase tracking-widest text-[#32CD32] shrink-0 bg-[#32CD32]/10 border-2 border-[#32CD32] px-2 py-1">
                          LINK_GEN
                        </div>
                        <input
                          readOnly
                          value={inviteLink}
                          className="flex-1 text-xs font-mono bg-transparent focus:outline-none font-bold truncate"
                        />
                        <button
                          onClick={copyLink}
                          className="shrink-0 p-2 border-2 border-black hover:bg-black hover:text-white transition-colors"
                        >
                          {copiedTeam ? <Check className="w-4 h-4 text-[#32CD32]" /> : <Copy className="w-4 h-4" />}
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
}
