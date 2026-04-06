"use client";

import { useState } from "react";
import { 
  Loader2, Copy, Check, UserCircle, Users, 
  ShieldCheck, Mail, ArrowRight,
  Plus, Layout, Github, Activity, ShieldAlert
} from "lucide-react";
import { AnimatePresence } from "framer-motion";
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
    <div className="space-y-12 pb-24">
      {/* ── Project Header ── */}
      <div className="p-10 md:p-12 border-8 border-black bg-white shadow-[16px_16px_0_0_black] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-full bg-black/5 -skew-x-12 translate-x-10 pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
            <div className="space-y-6">
              <div className="flex flex-wrap items-center gap-4">
                <span className="bg-[#FFD700] border-2 border-black px-4 py-1 text-[10px] font-black uppercase tracking-widest leading-none shadow-[4px_4px_0_0_black]">
                  UNIT_ID: {project.id.slice(0, 8)}
                </span>
                {project.plan && (
                  <span className="bg-[#FF00FF] text-white border-2 border-black px-4 py-1 text-[10px] font-black uppercase tracking-widest leading-none shadow-[4px_4px_0_0_black]">
                    {project.plan}_TIER
                  </span>
                )}
              </div>
              <h1 className="text-5xl md:text-8xl font-[900] tracking-tighter uppercase italic leading-none text-black break-words">
                {project.name}
              </h1>
              <p className="text-xl font-bold text-black/60 max-w-3xl leading-tight border-l-4 border-black pl-6 italic">
                {project.description || "Building the future of incident management, one project at a time."}
              </p>
            </div>
            
            <div className="w-24 h-24 bg-black border-4 border-black flex items-center justify-center -rotate-6 shadow-[8px_8px_0_0_#00D1FF] shrink-0">
               <Layout className="w-12 h-12 text-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16">
              {[
                { label: "OPERATIONAL_TEAMS", value: project.teams.length, icon: Users, color: "bg-[#00D1FF]" },
                { label: "ACTIVE_INCIDENTS", value: totalIssues, icon: ShieldAlert, color: "bg-[#FF3131]", text: "text-white" },
                { label: "UNIT_MANAGERS", value: project.managers.length, icon: ShieldCheck, color: "bg-[#32CD32]" },
                { 
                  label: project.githubRepoUrl ? "GITHUB_SYNC" : "SDK_STATUS", 
                  value: project.githubRepoUrl ? "ACTIVE" : "PENDING", 
                  icon: project.githubRepoUrl ? Github : Activity, 
                  color: "bg-black",
                  text: "text-white",
                  link: project.githubRepoUrl || undefined
                },
              ].map((stat) => (
                <div 
                  key={stat.label}
                  className="group relative"
                >
                  <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                  <div className="p-6 bg-white border-4 border-black h-full flex flex-col justify-between hover:translate-x-1 hover:translate-y-1 transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className={cn("p-2 border-2 border-black -rotate-6 group-hover:rotate-0 transition-transform shadow-[3px_3px_0_0_black]", stat.color, stat.text || "text-black")}>
                        <stat.icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-black text-black/40 uppercase tracking-widest">{stat.label}</span>
                    </div>
                    <div className="text-4xl font-[900] italic leading-none tracking-tighter">
                      {stat.value}
                    </div>
                  </div>
                  {stat.link && (
                    <a href={stat.link} target="_blank" rel="noopener noreferrer" className="absolute inset-0 z-20" />
                  )}
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          {/* Managers List */}
          <div className="p-10 border-4 border-black bg-white shadow-[12px_12px_0_0_#FFD700]">
            <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-8">
              <h2 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-4">
                <UserCircle className="w-8 h-8" /> ASSIGNED_MANAGERS
              </h2>
              <span className="text-[10px] font-black bg-black text-white px-3 py-1">UNITS_{project.managers.length}</span>
            </div>
            
            {project.managers.length === 0 ? (
              <div className="py-16 text-center border-4 border-black border-dashed bg-[#F8F8F8]">
                <p className="text-lg font-black uppercase italic opacity-20 tracking-widest">NO_MANAGERS_ALLOCATED</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {project.managers.map((mgr: Manager) => (
                  <div key={mgr.id} className="p-6 bg-white border-4 border-black group relative">
                    <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-black border-2 border-black flex items-center justify-center text-xl font-black text-[#FFD700] rotate-3 group-hover:rotate-0 transition-transform">
                          {mgr.email[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-lg font-black uppercase tracking-tighter leading-none mb-1 truncate">{mgr.email.split('@')[0]}</p>
                          <p className="text-[10px] font-bold text-black/40 truncate">{mgr.email}</p>
                        </div>
                      </div>
                      <div className={cn(
                        "px-3 py-1 border-2 border-black text-[10px] font-black uppercase shadow-[3px_3px_0_0_black]",
                        mgr.status === "ACTIVE" ? "bg-[#32CD32]" : "bg-black text-white"
                      )}>
                        {mgr.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Teams List */}
          <div className="p-10 border-4 border-black bg-white shadow-[12px_12px_0_0_#00D1FF]">
            <div className="flex items-center justify-between border-b-4 border-black pb-6 mb-10">
              <h2 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-4">
                <Users className="w-8 h-8" /> PROJECT_TEAMS
              </h2>
              <span className="text-[10px] font-black bg-black text-white px-3 py-1">UNITS_{project.teams.length}</span>
            </div>
            
            {project.teams.length === 0 ? (
              <div className="py-20 text-center border-4 border-black border-dashed bg-[#F8F8F8]">
                <p className="text-xl font-black uppercase italic opacity-20 tracking-widest">NO_OPERATIONAL_TEAMS</p>
              </div>
            ) : (
              <div className="space-y-8">
                {project.teams.map((team: Team) => (
                  <div key={team.id} className="border-4 border-black bg-white group relative">
                    <div className="absolute inset-0 bg-[#00D1FF] translate-x-2 translate-y-2 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all"></div>
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-8 border-b-4 border-black gap-6">
                      <div className="flex items-center gap-6">
                        <div className="w-14 h-14 bg-black border-2 border-black flex items-center justify-center font-black text-2xl text-white rotate-3 group-hover:rotate-0 transition-transform">
                          {team.name[0]}
                        </div>
                        <div className="space-y-1">
                          <Link 
                            href={`/dashboard/admin/teams/${team.id}`}
                            className="text-2xl font-[900] uppercase italic tracking-tighter underline decoration-4 hover:bg-[#FFD700] hover:text-black px-2 transition-colors"
                          >
                            {team.name}
                          </Link>
                          <div className="flex items-center gap-4 text-[10px] font-black uppercase text-black/40 mt-2 px-2">
                            <span>MEMBERS_{team.members.length}</span>
                            <span>{"//"}</span>
                            <span>INCIDENTS_{team._count.issues}</span>
                          </div>
                        </div>
                      </div>
                      <Link 
                        href={`/dashboard/admin/teams/${team.id}`}
                        className="w-full md:w-auto px-6 py-3 bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-[#00D1FF] hover:text-black transition-colors border-2 border-black flex items-center justify-center gap-2"
                      >
                        VIEW_RESOURCES <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                    
                    <div className="p-8 bg-[#F8F8F8] grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {team.members.map((m: TeamMember) => (
                        <div key={m.id} className="flex items-center justify-between p-4 bg-white border-2 border-black text-[10px] font-black uppercase">
                          <span className="truncate mr-4" title={m.email}>{m.email.split('@')[0]}</span>
                          <div className={cn("w-3 h-3 border border-black", m.status === 'ACTIVE' ? 'bg-[#32CD32]' : 'bg-black')} />
                        </div>
                      ))}
                      {team.members.length === 0 && (
                        <p className="text-[10px] font-black uppercase text-black/20 italic col-span-full py-2">UNIT_VOIDS_DETECTED: NO_RESOURCES_ALLOCATED</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Right column: Admin Controls ── */}
        <div className="space-y-12">
          {/* Assign Manager Form */}
          <div className="p-10 border-4 border-black bg-white shadow-[12px_12px_0_0_#FF00FF]">
            <div className="space-y-4 mb-10 border-b-2 border-black pb-6">
              <h2 className="text-3xl font-[900] uppercase italic tracking-tighter leading-none flex items-center gap-3">
                <ShieldAlert className="w-7 h-7" /> MANAGER_OPS
              </h2>
              <p className="text-xs font-bold text-black/60 leading-relaxed uppercase tracking-wider">
                Authorized override to allocate unit management permissions.
              </p>
            </div>

            {error && (
              <div className="p-4 bg-[#FF3131] text-white border-4 border-black font-black uppercase text-[10px] italic mb-6 animate-pulse">
                {error}
              </div>
            )}

            <form onSubmit={handleGenerateInvite} className="space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Mail className="w-4 h-4" /> TARGET_EMAIL
                </label>
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="w-full h-16 px-6 bg-white border-4 border-black font-black uppercase text-sm focus:outline-none focus:bg-[#FF00FF] focus:text-white transition-colors placeholder:text-black/20"
                  placeholder="OPERATOR@CORE.UNIT"
                />
              </div>
              <button
                type="submit"
                disabled={inviteLoading}
                className="w-full h-16 bg-black text-white font-[900] uppercase italic tracking-widest flex items-center justify-center hover:bg-[#FFD700] hover:text-black transition-all border-4 border-black shadow-[6px_6px_0_0_black] active:shadow-none active:translate-x-1 active:translate-y-1 disabled:opacity-50 group"
              >
                {inviteLoading ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : (
                  <span className="flex items-center gap-4 text-xl">
                    INIT_INVITE <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform stroke-[4px]" />
                  </span>
                )}
              </button>
            </form>

            <AnimatePresence>
              {inviteLink && (
                <div className="mt-10 p-8 border-4 border-black bg-[#F0F0F0] space-y-6 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-2 h-full bg-[#32CD32]"></div>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-black text-black flex items-center gap-2 uppercase tracking-tighter italic">
                      <Check className="w-4 h-4 stroke-[3px]" /> LINK_SECURE
                    </p>
                    <button 
                      onClick={() => { navigator.clipboard.writeText(inviteLink); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="text-[10px] font-black uppercase underline decoration-2 hover:bg-black hover:text-white px-2 py-1 transition-colors"
                    >
                      {copied ? "COPIED" : "COPY_PROTO"}
                    </button>
                  </div>
                  <div className="relative group">
                    <input 
                      readOnly 
                      value={inviteLink} 
                      className="w-full pr-12 pl-4 py-4 bg-white border-2 border-black text-[10px] font-mono font-bold focus:outline-none cursor-text truncate" 
                    />
                  </div>
                  <p className="text-[9px] text-black/30 text-center uppercase tracking-[0.3em] font-black">
                     AUTO_EXPIRATION: T-7_DAYS
                  </p>
                </div>
              )}
            </AnimatePresence>
          </div>

          {/* Project Insights */}
          <div className="p-8 border-4 border-black bg-black text-white flex flex-col items-center text-center space-y-4 rotate-1 border-dashed">
            <Activity className="w-10 h-10 text-[#00D1FF]" />
            <p className="text-[10px] font-black uppercase tracking-widest opacity-40 leading-relaxed italic">
              &quot;Unit Managers hold total sector authority. They monitor node telemetry and allocate developer resources.&quot;
            </p>
          </div>

          {/* SDK Integration Section */}
          {project.plan === "ADVANCED" && project.sdkApiKey && (
            <div className="border-8 border-black bg-white shadow-[16px_16px_0_0_#FF00FF] overflow-hidden">
              <div className="p-10 bg-black text-white space-y-4 border-b-8 border-black">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-[#32CD32]" /> NEXUS_SDK
                    </h3>
                  </div>
                  <div className={cn(
                    "px-4 py-1 border-2 border-white text-[10px] font-black uppercase tracking-tighter shadow-[3px_3px_0_0_white]",
                    project.isSdkConnected ? "bg-[#32CD32] text-black" : "bg-[#FF3131] text-white animate-pulse"
                  )}>
                    {project.isSdkConnected ? "LIVE_LINK_ACTIVE" : "NO_SIGNAL"}
                  </div>
                </div>
                <p className="text-xs font-bold uppercase tracking-widest opacity-40">Operational error ingestion pipeline protocols.</p>
              </div>

              <div className="p-10 space-y-10">
                {/* Step 0: Install */}
                <div className="space-y-4">
                   <p className="text-xs font-black uppercase flex items-center gap-3">
                     <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black rotate-12 group-hover:rotate-0 transition-transform">0</span>
                     PKG_INSTALLATION
                   </p>
                    <div className="space-y-4">
                      <div className="relative group">
                        <div className="p-6 pr-16 bg-black border-4 border-black font-mono text-[11px] text-[#00D1FF] font-black italic shadow-[6px_6px_0_0_#F0F0F0]">
                          npm install @devnexus/sdk
                        </div>
                        <button 
                          onClick={() => { navigator.clipboard.writeText('npm install @devnexus/sdk'); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white text-black border-2 border-black hover:bg-[#FFD700] transition-colors"
                        >
                          {copied ? <Check className="w-5 h-5 stroke-[3px]" /> : <Copy className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                </div>

                {/* Step 1: Initialize */}
                <div className="space-y-4">
                   <p className="text-xs font-black uppercase flex items-center gap-3">
                     <span className="w-8 h-8 bg-black text-white flex items-center justify-center text-xs font-black rotate-12 group-hover:rotate-0 transition-transform">1</span>
                     SYST_INITIALIZATION
                   </p>
                    <div className="p-6 bg-black border-4 border-black font-mono text-[11px] text-[#32CD32] font-black italic shadow-[6px_6px_0_0_#F0F0F0] overflow-x-auto">
{`import { Nexus } from '@devnexus/sdk';

Nexus.init({ 
  id: '${project.sdkApiKey}',
  uri: '${typeof window !== 'undefined' ? window.location.origin : ''}/api/ingest'
});`}
                    </div>
                   <p className="text-[10px] font-bold text-black/40 uppercase tracking-widest mt-2 flex items-start gap-3 border-l-2 border-black pl-4">
                     <Plus className="w-4 h-4 mt-0.5 shrink-0" />
                     INJECT INTO CORE ENTRY: LAYOUT.TSX / INDEX.JS
                   </p>
                </div>

                {/* API Key Section */}
                <div className="pt-8 border-t-4 border-black space-y-4">
                  <div className="flex justify-between items-center px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">MASTER_UNIT_KEY</label>
                    <span className="text-[10px] font-black uppercase text-[#FF3131] italic">!!! CLASSIFIED !!!</span>
                  </div>
                  <div className="relative group">
                    <input 
                      readOnly 
                      value={project.sdkApiKey} 
                      className="w-full h-14 px-5 pr-14 bg-white border-4 border-black text-xs font-mono font-black italic focus:outline-none" 
                    />
                    <button 
                      onClick={() => { navigator.clipboard.writeText(project.sdkApiKey!); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black text-white hover:bg-[#FFD700] hover:text-black transition-colors"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-[#F0F0F0] border-4 border-black flex items-start gap-4">
                  <Plus className="w-6 h-6 text-black mt-1 shrink-0" />
                  <div className="space-y-2">
                    <p className="text-[10px] font-black uppercase text-black leading-tight italic">
                      &quot;AUTO_CAPTURE: ENABLED. ALL_EXCEPTIONS_WILL_CREATE_INCIDENTS.&quot;
                    </p>
                    {project.githubRepoUrl && (
                      <p className="text-[9px] text-[#FF00FF] font-black uppercase tracking-widest flex items-center gap-2 mt-2">
                        <Check className="w-3 h-3 stroke-[3px]" /> GITHUB_REPOSITORY_SYNC: ACTIVE
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
