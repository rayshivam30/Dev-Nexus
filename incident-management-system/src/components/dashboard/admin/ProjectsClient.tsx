"use client";

import { useState } from "react";
import { Loader2, Trash2, Github, Mail, Layout, Info, Layers, CheckCircle2, X, Copy } from "lucide-react";

import Link from "next/link";

interface TeamSummary {
  id: string;
  name: string;
}

interface ManagerSummary {
  id: string;
  email: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  plan: string;
  teams: TeamSummary[];
  managers: ManagerSummary[];
  sdkApiKey?: string | null;
}

export function ProjectsClient({ initialProjects }: { initialProjects: Project[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [inviteManagerEmail, setInviteManagerEmail] = useState("");
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  
  const [plan, setPlan] = useState("BASIC");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [createdSdkKey, setCreatedSdkKey] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);

  // Use the imports to avoid unused var warnings if they are actually used in the UI
  // Copy and Check are used in the SDK modal but were reported as unused.
  // Plus was also reported as unused but I see it in other files, let's check here.
  // Wait, I don't see Plus being used in this file's JSX. 
  // I'll remove Plus from imports if it's truly unused.
  // Check is NOT used in the JSX I see in the previous view_file. 
  // Wait, line 361: {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
  // So Check and Copy ARE used.
  // Plus? I don't see Plus.

  async function handleDeleteProject(id: string) {
    if (!confirm("Are you sure you want to delete this project? All associated teams and issues might be affected.")) return;
    setDeleteLoadingId(id);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "Failed to delete project");
    } finally {
      setDeleteLoadingId(null);
    }
  }


  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateProjectLoading(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      
      // 1. Create the project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc, plan, githubRepoUrl })
      });
      
      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error);
      
      const newProjectId = projectData.project.id;

      // 2. If a manager email was provided, send an invite
      if (inviteManagerEmail.trim()) {
        const inviteRes = await fetch("/api/auth/invite", {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          },
          body: JSON.stringify({
            email: inviteManagerEmail.trim(),
            role: "MANAGER",
            projectId: newProjectId
          })
        });
        const inviteData = await inviteRes.json();
        if (!inviteRes.ok) throw new Error(`Project created, but failed to invite manager: ${inviteData.error}`);
      }

      setNewProjectName("");
      setNewProjectDesc("");
      setInviteManagerEmail("");
      setGithubRepoUrl("");
      setPlan("BASIC");
      
      const sdkApiKey = projectData.project?.sdkApiKey;
      if (sdkApiKey) {
        setIsModalOpen(false);
        setCreatedSdkKey(sdkApiKey);
      } else {
        setIsModalOpen(false);
        window.location.reload(); // Quick refresh to reflect the new project on SSR
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreateProjectLoading(false);
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Projects & Teams</h1>
          <p className="text-foreground/60">Manage your active projects and teams.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-foreground text-background px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity"
        >
          Create Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {initialProjects.length === 0 ? (
          <div className="col-span-full py-12 text-center text-foreground/50 border border-border rounded-xl bg-card">
            No projects created yet. Click &quot;Create Project&quot; to get started.
          </div>
        ) : (
          initialProjects.map(p => (
            <div key={p.id} className="block p-6 border border-border rounded-xl bg-card hover:border-foreground/30 transition-colors group relative overflow-hidden">
              <Link href={`/dashboard/admin/projects/${p.id}`} className="absolute inset-0 z-0"></Link>
              <div className="absolute top-0 left-0 w-1 h-full bg-foreground/20 group-hover:bg-foreground/50 transition-colors pointer-events-none z-10"></div>
              
              <div className="flex justify-between items-start mb-4 relative z-10 pointer-events-none">
                <Link href={`/dashboard/admin/projects/${p.id}`} className="font-semibold text-lg text-foreground line-clamp-1 pointer-events-auto hover:underline">{p.name}</Link>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDeleteProject(p.id);
                  }}
                  disabled={deleteLoadingId === p.id}
                  className="text-foreground/50 hover:text-red-500 transition-colors pointer-events-auto p-2 -mr-2 -mt-2 rounded-md disabled:opacity-50"
                  title="Delete Project"
                >
                  {deleteLoadingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
              
              <div className="relative z-10 pointer-events-none">
                {p.description && (
                  <p className="text-sm text-foreground/70 mb-4 line-clamp-2">{p.description}</p>
                )}
                <div className="flex items-center gap-4 text-xs text-foreground/50 mt-auto pt-4 border-t border-border">
                  <span>{p.teams?.length || 0} Teams</span>
                  <span>{p.managers?.length || 0} Managers</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-border/50 rounded-[2rem] shadow-2xl w-full max-w-lg flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border/50">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-foreground/5">
                  <Layout className="w-5 h-5 text-foreground/70" />
                </div>
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Create New Project</h2>
                  <p className="text-xs text-foreground/50">Set up a new workspace for your team</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 rounded-full hover:bg-foreground/5 text-foreground/50 hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-6 pt-2 space-y-6 overflow-y-auto max-h-[80vh]">
              <div className="space-y-4">
                {/* Project Basics Section */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      Project Name <span className="text-red-500">*</span>
                    </label>
                    <input 
                      required 
                      value={newProjectName} 
                      onChange={e=>setNewProjectName(e.target.value)} 
                      className="w-full px-4 py-2.5 bg-foreground/5 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all placeholder:text-foreground/30" 
                      placeholder="E.g., Core API Integration" 
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-semibold flex items-center gap-2">
                      <Info className="w-4 h-4" />
                      Description (Optional)
                    </label>
                    <textarea 
                      value={newProjectDesc} 
                      onChange={e=>setNewProjectDesc(e.target.value)} 
                      rows={3}
                      className="w-full px-4 py-2.5 bg-foreground/5 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all resize-none placeholder:text-foreground/30" 
                      placeholder="Briefly describe the purpose of this project..." 
                    />
                  </div>
                </div>

                {/* Plan Selection Section */}
                <div className="space-y-3 pt-2">
                  <label className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    Select Plan <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { id: "BASIC", name: "Basic", desc: "For small hobby projects", color: "bg-blue-500/10 text-blue-500" },
                      { id: "ADVANCED", name: "Advanced", desc: "Best for growing teams", color: "bg-purple-500/10 text-purple-500" },
                      { id: "PRO", name: "Pro", desc: "Enterprise scale power", color: "bg-amber-500/10 text-amber-500" }
                    ].map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setPlan(p.id)}
                        className={`relative p-3 rounded-xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-1 ${
                          plan === p.id 
                            ? 'border-foreground bg-foreground/5 ring-4 ring-foreground/5' 
                            : 'border-border/50 hover:border-foreground/20 hover:bg-foreground/[0.02]'
                        } ${p.id === 'PRO' ? 'opacity-80' : ''}`}
                      >
                        {plan === p.id && p.id !== 'PRO' && (
                          <div className="absolute top-2 right-2">
                            <CheckCircle2 className="w-4 h-4 text-foreground" />
                          </div>
                        )}
                        <div className="text-sm font-bold flex items-center justify-between">
                          {p.name}
                          {p.id === 'PRO' && (
                            <span className="text-[8px] bg-foreground text-background px-1 rounded font-bold uppercase tracking-tighter">Coming Soon</span>
                          )}
                        </div>
                        <div className="text-[10px] text-foreground/50 leading-tight">{p.id === 'PRO' ? "Unlocking Soon..." : p.desc}</div>
                        <div className={`mt-1 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded w-fit ${p.color}`}>
                          {p.id}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {plan === 'PRO' ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 border-2 border-dashed border-border/50 rounded-[2rem] bg-foreground/[0.02] animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-4 rounded-full bg-amber-500/10">
                      <Layers className="w-12 h-12 text-amber-500" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold">Pro Plan is Coming Soon</h3>
                      <p className="text-sm text-foreground/50 max-w-[240px]">
                        We&apos;re putting the finishing touches on our Enterprise-grade features.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Integration & Invitations Section */}
                    <div className="space-y-4 pt-2">
                      {["BASIC", "ADVANCED"].includes(plan) && (
                        <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                          <label className="text-sm font-semibold flex items-center gap-2">
                            <Github className="w-4 h-4" />
                            GitHub Repository URL <span className="text-red-500">*</span>
                          </label>
                          <input 
                            type="url"
                            required
                            value={githubRepoUrl} 
                            onChange={e=>setGithubRepoUrl(e.target.value)} 
                            className="w-full px-4 py-2.5 bg-foreground/5 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all placeholder:text-foreground/30" 
                            placeholder="https://github.com/org/repo" 
                          />
                          <p className="text-[10px] text-foreground/40 italic ml-1">Connect for automatic issue ingestion via Webhooks.</p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <label className="text-sm font-semibold flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Invite Manager (Optional)
                        </label>
                        <input 
                          type="email"
                          value={inviteManagerEmail} 
                          onChange={e=>setInviteManagerEmail(e.target.value)} 
                          className="w-full px-4 py-2.5 bg-foreground/5 border border-border/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-foreground/10 focus:border-foreground/30 transition-all placeholder:text-foreground/30" 
                          placeholder="manager@example.com" 
                        />
                        <p className="text-[10px] text-foreground/40 italic ml-1">They&apos;ll get an invitation link to join as a Project Manager.</p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="pt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-border/50">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-foreground/5 transition-all text-foreground/60 hover:text-foreground"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createProjectLoading || !newProjectName.trim() || plan === 'PRO' || (['BASIC', 'ADVANCED'].includes(plan) && !githubRepoUrl.trim())} 
                  className="px-8 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl flex items-center justify-center min-w-[140px] hover:opacity-90 shadow-lg shadow-foreground/10 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {createProjectLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Creating...</span>
                    </div>
                  ) : (
                    "Create Project"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SDK API Key Modal */}
      {createdSdkKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-background border border-border/50 rounded-[2rem] shadow-2xl w-full max-w-md p-0 flex flex-col animate-in zoom-in-95 duration-300 overflow-hidden text-foreground">
            <div className="bg-foreground/5 px-8 pt-8 pb-6 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="w-10 h-10 text-green-500" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight">Project Created!</h2>
              <p className="text-foreground/50 text-sm max-w-xs mt-2">
                Your project is ready. Here is your SDK API Key to start tracking issues.
              </p>
            </div>
            
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-foreground/40 px-1">Your SDK API Key</label>
                <div className="group relative">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
                  <div className="relative bg-background border border-border/50 p-4 rounded-xl flex items-center justify-between gap-4">
                    <code className="text-sm font-mono text-foreground break-all select-all">{createdSdkKey}</code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdSdkKey);
                        // Optional: show a toast or change icon
                      }}
                      className="p-2 hover:bg-foreground/5 rounded-lg transition-colors text-foreground/40 hover:text-foreground"
                      title="Copy to clipboard"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-red-500/80 font-medium px-1">
                  Important: Copy this key now! It won&apos;t be shown again for security reasons.
                </p>
              </div>
              
              <div className="bg-foreground/5 p-5 rounded-2xl border border-border/30 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <div className="p-1 rounded bg-foreground text-background">
                    <Layers className="w-3 h-3" />
                  </div>
                  Quick Start Guide
                </div>
                <div className="text-[11px] font-mono text-foreground/70 bg-black/5 p-3 rounded-lg overflow-x-auto border border-border/50">
                  <pre className="whitespace-pre">
{`npm install @devnexus/sdk
377: 
378: import { DevNexus } from '@devnexus/sdk';
379: 
380: DevNexus.init({
381:   apiKey: '${createdSdkKey}',
382:   environment: 'production'
383: });`}
                  </pre>
                </div>
              </div>

              <button 
                onClick={() => {
                  setCreatedSdkKey(null);
                  window.location.reload();
                }} 
                className="w-full py-4 bg-foreground text-background font-bold rounded-xl hover:opacity-90 shadow-xl shadow-foreground/10 active:scale-[0.98] transition-all"
              >
                I&apos;ve copied the key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
