"use client";

import { useState } from "react";
import { 
  Loader2, Copy, Check, UserCircle, Users, 
  Layers, ShieldCheck, Mail, ArrowRight,
  ExternalLink, Plus, Layout
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
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
  isSdkConnected?: boolean;
  issues?: Issue[];
}

export function ProjectDetailClient({ project: initialProject }: { project: DetailedProject }) {
  const project = initialProject;
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteLink, setInviteLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  const totalIssues = project._count?.issues || 0;

  async function handleGenerateInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteLoading(true);
    setInviteLink("");
    setError("");
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/auth/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    <div className="space-y-8 pb-12">
      {/* ── Project Header ── */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl border border-border bg-card/50 backdrop-blur-md p-8 md:p-10"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full -ml-32 -mb-32 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold tracking-wider uppercase">
                  Project Details
                </div>
                {project.plan && (
                  <div className="inline-flex items-center px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-500 text-xs font-bold tracking-wider uppercase">
                    {project.plan} PLAN
                  </div>
                )}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-foreground bg-clip-text mt-2">
                {project.name}
              </h1>
              <p className="text-lg text-foreground/60 max-w-2xl leading-relaxed">
                {project.description || "Building the future of incident management, one project at a time."}
              </p>
            </div>
            
            <div className="flex gap-4">
              <div className="h-14 w-14 rounded-2xl bg-accent/20 border border-border flex items-center justify-center">
                <Layout className="w-7 h-7 text-primary" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
            {[
              { label: "Total Teams", value: project.teams.length, icon: Users, color: "text-blue-400" },
              { label: "Active Issues", value: totalIssues, icon: Layers, color: "text-amber-400" },
              { label: "Managers", value: project.managers.length, icon: ShieldCheck, color: "text-emerald-400" },
              { label: "Project ID", value: project.id.slice(0, 8), icon: Mail, color: "text-purple-400" },
            ].map((stat, i) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="p-4 rounded-2xl bg-accent/10 border border-border hover:bg-accent/20 transition-colors"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-lg bg-background/50 border border-border ${stat.color}`}>
                    <stat.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-medium text-foreground/50 uppercase tracking-wider">{stat.label}</span>
                </div>
                <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ── Assigned Managers ── */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-2 space-y-8"
        >
          <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <UserCircle className="w-6 h-6 text-primary" /> Assigned Managers
              </h2>
              {project.managers.length > 0 && (
                <span className="text-xs font-mono text-foreground/40 uppercase tracking-tighter tracking-wider">{project.managers.length} ACTIVE</span>
              )}
            </div>
            
            {project.managers.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                <UserCircle className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                <p className="text-foreground/50">No managers assigned to this project yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.managers.map((mgr: Manager) => (
                  <div key={mgr.id} className="p-4 rounded-2xl border border-border bg-accent/5 hover:bg-accent/10 transition-all group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary transition-transform group-hover:scale-110">
                          {mgr.email[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-foreground truncate max-w-[150px]">{mgr.email.split('@')[0]}</p>
                          <p className="text-xs text-foreground/40">{mgr.email}</p>
                        </div>
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-tighter ${
                        mgr.status === "ACTIVE" ? "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20" : "text-foreground/30 bg-foreground/10 border border-border"
                      }`}>
                        {mgr.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <Users className="w-6 h-6 text-primary" /> Project Teams
            </h2>
            
            {project.teams.length === 0 ? (
              <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl">
                <Users className="w-12 h-12 text-foreground/10 mx-auto mb-4" />
                <p className="text-foreground/50">Create teams to start organizing work.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {project.teams.map((team: Team) => (
                  <div key={team.id} className="rounded-2xl border border-border overflow-hidden">
                    <div className="flex justify-between items-center p-5 bg-accent/10 hover:bg-accent/15 transition-colors group/team">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-background flex items-center justify-center border border-border font-bold text-xs group-hover/team:border-primary transition-colors">
                          {team.name[0]}
                        </div>
                        <Link 
                          href={`/dashboard/admin/teams/${team.id}`}
                          className="font-bold text-lg hover:text-primary transition-colors flex items-center gap-2"
                        >
                          {team.name}
                          <ExternalLink className="w-4 h-4 opacity-0 group-hover/team:opacity-100 transition-opacity" />
                        </Link>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs font-medium text-foreground/50">{team.members.length} Members</span>
                        <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-xs font-bold">
                          {team._count.issues} Issues
                        </span>
                      </div>
                    </div>
                    
                    <div className="p-5 bg-background/50 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {team.members.map((m: TeamMember) => (
                        <div key={m.id} className="flex items-center justify-between p-2 rounded-xl bg-card border border-border/50 text-xs">
                          <span className="text-foreground/70 truncate mr-2" title={m.email}>{m.email.split('@')[0]}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-foreground/20'}`} />
                        </div>
                      ))}
                      {team.members.length === 0 && (
                        <p className="text-xs text-foreground/30 col-span-full italic">No members in this team yet.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Unassigned Issues Section */}
          {project.issues && project.issues.length > 0 && (
            <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Layers className="w-6 h-6 text-amber-500" /> Unassigned Project Issues
              </h2>
              <div className="space-y-4">
                {project.issues.map((issue: Issue) => (
                  <div key={issue.id} className="p-4 rounded-xl border border-border bg-accent/5 hover:bg-accent/10 transition-colors flex justify-between items-center group">
                    <div className="flex-1 pr-4">
                      <p className="font-semibold text-foreground group-hover:text-primary transition-colors">{issue.title}</p>
                      <p suppressHydrationWarning className="text-xs text-foreground/50 mt-1">{new Date(issue.createdAt || "").toLocaleDateString()}</p>
                    </div>
                    <div className="flex gap-2 text-[10px] font-bold uppercase tracking-wider shrink-0">
                      <span className={`px-2 py-1 rounded-md border ${issue.severity === 'CRITICAL' || issue.severity === 'HIGH' ? 'bg-red-500/10 border-red-500/20 text-red-500' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'}`}>
                        {issue.severity}
                      </span>
                      <span className="px-2 py-1 rounded-md bg-foreground/10 border border-border text-foreground/70 hidden sm:inline-block">
                        {issue.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* ── Right column: Assign Manager Form ── */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
          className="space-y-6"
        >
          <div className="rounded-3xl border border-border bg-card p-8 space-y-6">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold tracking-tight">Assign Manager</h2>
              <p className="text-sm text-foreground/60 leading-relaxed">
                Invite a manager to oversee this project and manage teams.
              </p>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 text-destructive text-sm"
              >
                {error}
              </motion.div>
            )}

            <form onSubmit={handleGenerateInvite} className="space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-semibold ml-1 flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5" /> Email Address
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-12 px-4 bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all placeholder:text-foreground/20"
                  placeholder="manager@domain.com"
                />
              </div>
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full h-12 bg-primary text-primary-foreground font-bold rounded-xl flex items-center justify-center hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 group"
              >
                {inviteLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="flex items-center gap-2">
                    Send Invite <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </button>
            </form>

            <AnimatePresence>
              {inviteLink && (
                <motion.div 
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-5 bg-accent/30 border border-primary/20 rounded-2xl space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-primary flex items-center gap-2">
                      <Check className="w-4 h-4" /> Link Generated
                    </p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-xs font-bold hover:underline"
                    >
                      {copied ? "COPIED" : "COPY LINK"}
                    </button>
                  </div>
                  <div className="relative group">
                    <input 
                      readOnly 
                      value={inviteLink} 
                      className="w-full pr-10 pl-3 py-3 bg-background/50 border border-border rounded-xl text-[10px] font-mono focus:outline-none cursor-text" 
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/20">
                      {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                    </div>
                  </div>
                  <p className="text-[10px] text-foreground/40 text-center uppercase tracking-widest font-bold">
                    Expires in 7 days
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="rounded-3xl border border-border bg-primary/5 p-6 border-dashed">
            <p className="text-xs text-foreground/50 leading-relaxed text-center italic">
              &quot;Managers can see project-specific issues, manage their assigned teams, and invite developers to their teams.&quot;
            </p>
          </div>

          {project.plan === "ADVANCED" && project.sdkApiKey && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
              className="rounded-3xl border border-purple-500/20 bg-purple-500/5 p-8 space-y-6"
            >
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <h3 className="text-xl font-bold text-purple-500 flex items-center gap-2">
                    <ShieldCheck className="w-6 h-6" /> SDK Integration
                  </h3>
                  <p className="text-sm text-foreground/60 leading-relaxed">
                    Automated error tracking for your production applications.
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-widest ${
                  project.isSdkConnected 
                    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" 
                    : "bg-amber-500/10 border-amber-500/20 text-amber-500 animate-pulse"
                }`}>
                  {project.isSdkConnected ? "Live Ingestion Active" : "Waiting for first event..."}
                </div>
              </div>

              <div className="space-y-6">
                {/* Step 0: Install */}
                <div className="space-y-3">
                   <p className="text-xs font-bold flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-500">0</span>
                     Install Package
                   </p>
                    <div className="space-y-2">
                      <div className="relative group">
                        <div className="p-3 pr-12 rounded-xl bg-black/40 border border-purple-500/10 font-mono text-[11px] text-purple-300">
                          npm install @devnexus/sdk
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText('npm install @devnexus/sdk'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors text-purple-500/40"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      <div className="text-[10px] text-amber-500/80 italic ml-7 space-y-2">
                        <p>Note: For local testing, use the standalone SDK path:</p>
                        <code className="text-foreground/40 block bg-black/20 p-2 rounded font-mono">npm install ../sdk</code>
                        <p className="text-[9px] text-foreground/30">Or use absolute path:</p>
                        <code className="text-foreground/20 block bg-black/10 p-1 rounded font-mono">npm install &quot;C:\Users\91626\OneDrive\Desktop\DevNexus\sdk&quot;</code>
                      </div>
                    </div>
                </div>

                {/* Step 1: Initialize */}
                <div className="space-y-3">
                   <p className="text-xs font-bold flex items-center gap-2">
                     <span className="w-5 h-5 rounded-full bg-purple-500/20 flex items-center justify-center text-[10px] text-purple-500">1</span>
                     Initialize SDK
                   </p>
                    <div suppressHydrationWarning className="p-3 rounded-xl bg-black/40 border border-purple-500/10 font-mono text-[10px] overflow-x-auto text-purple-300">
{`import { DevNexus } from '@devnexus/sdk';

DevNexus.init({ 
  apiKey: '${project.sdkApiKey}',
  baseUrl: '${typeof window !== 'undefined' ? window.location.origin : ''}/api/ingest',
  autoCapture: true 
});`}
                    </div>
                   <p className="text-[10px] text-foreground/40 mt-1 ml-7 flex items-start gap-2">
                     <Plus className="w-3 h-3 mt-0.5 shrink-0" />
                     Paste this in your entry file (e.g. <code className="text-purple-400">layout.tsx</code>, <code className="text-purple-400">index.js</code>, or <code className="text-purple-400">main.ts</code>) to start tracking errors globally.
                   </p>
                </div>

                {/* API Key Section */}
                <div className="pt-4 border-t border-purple-500/10 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-purple-500/50">Project API Key</label>
                    <span className="text-[10px] text-foreground/30 italic">Keep this secret</span>
                  </div>
                  <div className="relative group">
                    <input 
                      readOnly 
                      value={project.sdkApiKey} 
                      className="w-full h-10 px-3 pr-10 bg-background/50 border border-purple-500/20 rounded-xl text-xs font-mono focus:outline-none" 
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(project.sdkApiKey!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-purple-500/10 rounded-lg transition-colors text-purple-500/40 hover:text-purple-500"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-3">
                  <Plus className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <div className="space-y-1">
                    <p className="text-[10px] text-foreground/60 leading-relaxed italic">
                      &quot;Once integrated, unhandled errors in your app will automatically create <strong>High Severity</strong> issues in DevNexus.&quot;
                    </p>
                    {project.githubRepoUrl && (
                      <p className="text-[10px] text-purple-400 font-bold flex items-center gap-1.5">
                        <Check className="w-3 h-3" /> GitHub Sync Active: SDK issues will be mirrored to your repository.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
