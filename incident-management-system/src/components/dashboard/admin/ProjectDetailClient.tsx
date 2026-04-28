"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, Copy, Check, UserCircle, Users, 
  ShieldCheck, Mail, ArrowRight,
  Plus, Layout, Github, Activity, ShieldAlert
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";

interface Manager {
  id: string;
  email: string;
  status: string;
}

interface TeamMember {
  id: string;
  email: string;
  status: string;
}

interface Team {
  id: string;
  name: string;
  _count: { issues: number };
  members: TeamMember[];
}

interface DetailedProject {
  id: string;
  name: string;
  description?: string | null;
  managers: Manager[];
  teams: Team[];
  _count?: { issues: number };
  plan?: string;
  sdkApiKey?: string | null;
  githubRepoUrl?: string | null;
  githubInstallationId?: string | null;
  isSdkConnected?: boolean;
  issues?: Issue[];
}

export function ProjectDetailClient({ project: initialProject }: { project: DetailedProject }) {
  const project = initialProject;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [npmCopied, setNpmCopied] = useState(false);
  const [keyCopied, setKeyCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [error, setError] = useState("");
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const totalIssues = project._count?.issues || 0;

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteLink("");
    setError("");
    try {
      const res = await fetch("/api/invite-manager", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: "MANAGER",
          projectId: project.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInviteLink(data.inviteLink);
      setInviteEmail("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate invite");
    } finally {
      setInviteLoading(false);
    }
  }

  return (
    <div className="space-y-8 pb-24">
      {/* ── Project Header ── */}
      <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-8">
          <div className="space-y-4 flex-1">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg text-zinc-500">
                ID: {project.id.slice(0, 8)}
              </span>
              {project.plan && (
                <span className="text-[10px] font-medium bg-white/[0.06] border border-white/[0.08] px-2.5 py-1 rounded-lg text-zinc-400 uppercase">
                  {project.plan}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {project.name}
            </h1>
            <p className="text-sm text-zinc-500 max-w-2xl leading-relaxed">
              {project.description || "No description provided."}
            </p>
          </div>
          <div className="w-14 h-14 bg-white/[0.04] border border-white/[0.06] rounded-2xl flex items-center justify-center shrink-0">
            <Layout className="w-6 h-6 text-zinc-500" />
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-8">
          {[
            { label: "Teams", value: project.teams.length, icon: Users },
            { label: "Incidents", value: totalIssues, icon: ShieldAlert },
            { label: "Managers", value: project.managers.length, icon: ShieldCheck },
            { 
              label: "GitHub", 
              value: project.githubInstallationId ? "Connected" : "Not connected", 
              icon: Github, 
              link: project.githubRepoUrl || undefined
            },
          ].map((stat) => (
            <div key={stat.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.04] transition-all relative">
              <div className="flex items-center justify-between mb-3">
                <stat.icon className="w-4 h-4 text-zinc-600" />
                <span className="text-[10px] text-zinc-600 font-medium">{stat.label}</span>
              </div>
              <div className={cn("text-2xl font-extrabold", !project.githubInstallationId && stat.label === "GitHub" && "text-amber-400 text-lg")}>{stat.value}</div>
              {stat.link && (
                <a href={stat.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20" />
              )}
            </div>
          ))}
        </div>

        {/* GitHub Connection Banner */}
        {!project.githubInstallationId && (
          <div className="mt-6 p-5 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0">
                <Github className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-sm font-semibold">Connect GitHub Repository</p>
                <p className="text-xs text-zinc-500 mt-0.5">Install the GitHub App to auto-track CI failures, PR conflicts, and more.</p>
              </div>
            </div>
            <button
              onClick={() => {
                const appSlug = process.env.NEXT_PUBLIC_GITHUB_APP_SLUG;
                window.open(`https://github.com/apps/${appSlug}/installations/new?state=${project.id}`, "_blank");
              }}
              className="px-5 py-2.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-all flex items-center gap-2 shrink-0"
            >
              <Github className="w-4 h-4" />
              Install GitHub App
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Managers List */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-zinc-600" /> Managers
              </h2>
              <span className="text-xs text-zinc-600 bg-white/[0.04] px-2.5 py-1 rounded-md">{project.managers.length}</span>
            </div>
            
            {project.managers.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-sm text-zinc-700">No managers assigned</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {project.managers.map((mgr: Manager) => (
                  <div key={mgr.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center text-sm font-bold text-zinc-400">
                        {mgr.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{mgr.email.split('@')[0]}</p>
                        <p className="text-[10px] text-zinc-600 truncate">{mgr.email}</p>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[10px] font-medium px-2 py-0.5 rounded-md",
                      mgr.status === "ACTIVE" ? "text-emerald-400 bg-emerald-500/10" : "text-zinc-500 bg-white/[0.04]"
                    )}>
                      {mgr.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Users className="w-5 h-5 text-zinc-600" /> Teams
              </h2>
              <span className="text-xs text-zinc-600 bg-white/[0.04] px-2.5 py-1 rounded-md">{project.teams.length}</span>
            </div>
            
            {project.teams.length === 0 ? (
              <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.06]">
                <p className="text-sm text-zinc-700">No teams created</p>
              </div>
            ) : (
              <div className="space-y-3">
                {project.teams.map((team: Team) => (
                  <div key={team.id} className="rounded-xl border border-white/[0.04] overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 gap-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white/[0.06] rounded-lg flex items-center justify-center font-bold text-zinc-400">
                          {team.name[0]}
                        </div>
                        <div>
                          <Link 
                            href={`/dashboard/admin/teams/${team.id}`}
                            className="text-base font-bold hover:text-white transition-colors"
                          >
                            {team.name}
                          </Link>
                          <div className="flex items-center gap-3 text-[10px] text-zinc-600 mt-0.5">
                            <span>{team.members.length} members</span>
                            <span>·</span>
                            <span>{team._count.issues} incidents</span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/dashboard/admin/teams/${team.id}`}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] transition-all"
                      >
                        View <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                    
                    {team.members.length > 0 && (
                      <div className="px-5 py-3 border-t border-white/[0.04] bg-white/[0.01] flex flex-wrap gap-2">
                        {team.members.map((m: TeamMember) => (
                          <span key={m.id} className="flex items-center gap-1.5 text-[10px] text-zinc-500 bg-white/[0.03] px-2 py-1 rounded-md">
                            <span className={cn("w-1.5 h-1.5 rounded-full", m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-700')} />
                            {m.email.split('@')[0]}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Admin Controls ── */}
        <div className="space-y-6">
          {/* Assign Manager Form */}
          <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
            <h2 className="text-base font-bold flex items-center gap-2 mb-1">
              <Mail className="w-4 h-4 text-zinc-600" /> Invite Manager
            </h2>
            <p className="text-xs text-zinc-600 mb-5">Generate an invite link for a new manager.</p>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 mb-4">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerateInvite} className="space-y-3">
              <input
                type="email"
                required
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 text-sm placeholder:text-zinc-700 transition-all"
                placeholder="manager@company.com"
              />
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {inviteLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>Generate Invite <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <AnimatePresence>
              {inviteLink && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="mt-4 p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                      <Check className="w-3 h-3" /> Link generated
                    </p>
                    <button
                      onClick={() => { navigator.clipboard.writeText(inviteLink); setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}
                      className="text-[10px] text-zinc-500 hover:text-white transition-colors"
                    >
                      {linkCopied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <input readOnly value={inviteLink} className="w-full px-3 py-2 bg-black/40 border border-white/[0.06] rounded-lg text-[10px] font-mono text-zinc-400 truncate" />
                  <p className="text-[10px] text-zinc-700 text-center">Expires in 7 days</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* SDK Integration Section */}
          {project.plan === "ADVANCED" && project.sdkApiKey && (
            <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
              <div className="p-5 border-b border-white/[0.06]">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-zinc-600" /> SDK Setup
                  </h3>
                  <span className={cn(
                    "text-[10px] font-medium px-2 py-0.5 rounded-md",
                    project.isSdkConnected ? "text-emerald-400 bg-emerald-500/10" : "text-amber-400 bg-amber-500/10"
                  )}>
                    {project.isSdkConnected ? "Connected" : "Pending"}
                  </span>
                </div>
              </div>

              <div className="p-5 space-y-5">
                {/* Install */}
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-600 font-medium">1. Install</p>
                  <div className="relative">
                    <div className="p-3 bg-black/40 border border-white/[0.04] rounded-lg font-mono text-xs text-zinc-400">
                      npm install @devnexus/sdk
                    </div>
                    <button
                      onClick={() => { navigator.clipboard.writeText('npm install @devnexus/sdk'); setNpmCopied(true); setTimeout(() => setNpmCopied(false), 2000); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-white transition-colors"
                    >
                      {npmCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Initialize */}
                <div className="space-y-2">
                  <p className="text-[10px] text-zinc-600 font-medium">2. Initialize</p>
                  <div className="p-3 bg-black/40 border border-white/[0.04] rounded-lg font-mono text-[11px] text-zinc-400 overflow-x-auto whitespace-pre">
{`import { DevNexus } from '@devnexus/sdk';

DevNexus.init({
  apiKey: '${project.sdkApiKey}',
  baseUrl: '${origin || "<YOUR_APP_URL>"}/api/ingest'
});`}
                  </div>
                </div>

                {/* API Key */}
                <div className="space-y-2 pt-4 border-t border-white/[0.06]">
                  <label className="text-[10px] text-zinc-600 font-medium">API Key</label>
                  <div className="relative">
                    <input readOnly value={project.sdkApiKey} className="w-full px-3 py-2.5 pr-10 bg-black/40 border border-white/[0.04] rounded-lg text-xs font-mono text-zinc-400 truncate" />
                    <button
                      onClick={() => { navigator.clipboard.writeText(project.sdkApiKey!); setKeyCopied(true); setTimeout(() => setKeyCopied(false), 2000); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-white transition-colors"
                    >
                      {keyCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {project.githubRepoUrl && (
                  <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                    <Check className="w-3 h-3" /> GitHub repository synced
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
