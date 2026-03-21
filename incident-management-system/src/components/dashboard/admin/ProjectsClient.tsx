"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Link from "next/link";

export function ProjectsClient({ initialProjects }: { initialProjects: any[] }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [inviteManagerEmail, setInviteManagerEmail] = useState("");
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  
  const [plan, setPlan] = useState("BASIC");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [createdSdkKey, setCreatedSdkKey] = useState<string | null>(null);


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
    } catch (err: any) {
      alert(err.message);
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
            No projects created yet. Click "Create Project" to get started.
          </div>
        ) : (
          initialProjects.map(p => (
            <Link key={p.id} href={`/dashboard/admin/projects/${p.id}`} className="block p-6 border border-border rounded-xl bg-card hover:border-foreground/30 transition-colors group relative overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-foreground/20 group-hover:bg-foreground/50 transition-colors"></div>
              <div className="flex justify-between items-start mb-4">
                <div className="font-semibold text-lg text-foreground line-clamp-1">{p.name}</div>
              </div>
              {p.description && (
                <p className="text-sm text-foreground/70 mb-4 line-clamp-2">{p.description}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-foreground/50 mt-auto pt-4 border-t border-border">
                <span>{p.teams?.length || 0} Teams</span>
                <span>{p.managers?.length || 0} Managers</span>
              </div>
            </Link>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-semibold">Create New Project</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-foreground/50 hover:text-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium">Project Name <span className="text-red-500">*</span></label>
                <input 
                  required 
                  value={newProjectName} 
                  onChange={e=>setNewProjectName(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
                  placeholder="E.g., Core API Integration" 
                />
              </div>
              
              <div className="space-y-1">
                <label className="text-sm font-medium">Description (Optional)</label>
                <textarea 
                  value={newProjectDesc} 
                  onChange={e=>setNewProjectDesc(e.target.value)} 
                  rows={3}
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none" 
                  placeholder="Briefly describe the project..." 
                />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium">Select Plan <span className="text-red-500">*</span></label>
                <div className="flex gap-4 mb-2">
                  {["BASIC", "ADVANCED", "PRO"].map((p) => (
                    <label key={p} className="flex items-center gap-2 cursor-pointer">
                      <input 
                        type="radio" 
                        name="plan" 
                        value={p} 
                        checked={plan === p} 
                        onChange={(e) => setPlan(e.target.value)} 
                        className="accent-foreground"
                      />
                      <span className="text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>

              {["BASIC", "ADVANCED"].includes(plan) && (
                <div className="space-y-1 pb-2">
                  <label className="text-sm font-medium">GitHub Repository URL (Optional)</label>
                  <input 
                    type="url"
                    value={githubRepoUrl} 
                    onChange={e=>setGithubRepoUrl(e.target.value)} 
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
                    placeholder="https://github.com/org/repo" 
                  />
                  <p className="text-xs text-foreground/50 mt-1">For automatic CI/CD issue ingestion via Webhooks.</p>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-sm font-medium">Invite Manager (Optional)</label>
                <input 
                  type="email"
                  value={inviteManagerEmail} 
                  onChange={e=>setInviteManagerEmail(e.target.value)} 
                  className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
                  placeholder="manager@example.com" 
                />
                <p className="text-xs text-foreground/50 mt-1">An invitation link will be sent assigning them as a Manager.</p>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-4 py-2 border border-border rounded-md font-medium hover:bg-accent/50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={createProjectLoading || !newProjectName.trim()} 
                  className="px-4 py-2 bg-foreground text-background font-medium rounded-md flex items-center justify-center min-w-[120px] hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                  {createProjectLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SDK API Key Modal */}
      {createdSdkKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-lg p-8 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h2 className="text-xl font-semibold">Project Created Successfully!</h2>
              <button 
                onClick={() => {
                  setCreatedSdkKey(null);
                  window.location.reload();
                }} 
                className="text-foreground/50 hover:text-foreground"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
            
            <div className="space-y-4">
              <p className="text-foreground/80">
                You selected the <strong>Advanced</strong> plan. To automatically catch and ingest frontend and backend errors, please install our SDK and initialize it with this API Key.
              </p>
              
              <div className="bg-muted p-4 rounded-md overflow-x-auto border border-border">
                <code className="text-sm font-mono text-primary break-all">{createdSdkKey}</code>
              </div>
              
              <div className="bg-card p-4 rounded-md border border-border text-sm">
                <p className="font-semibold mb-2">Quick Start (Next.js / Node):</p>
                <pre className="text-xs text-foreground/70 whitespace-pre-wrap">
{`npm install @devnexus/sdk

import { DevNexus } from '@devnexus/sdk';

DevNexus.init({
  apiKey: '${createdSdkKey}',
  environment: process.env.NODE_ENV
});`}
                </pre>
              </div>
              
              <p className="text-xs text-red-500 font-medium pt-2">
                Make sure to copy this key now! You won't be able to see it again.
              </p>
            </div>

            <div className="pt-4 flex justify-end">
              <button 
                onClick={() => {
                  setCreatedSdkKey(null);
                  window.location.reload();
                }} 
                className="px-6 py-2 bg-foreground text-background font-medium rounded-md hover:opacity-90 transition-opacity"
              >
                I have copied the key
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
