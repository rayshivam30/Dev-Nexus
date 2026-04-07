"use client";

import { useState } from "react";
import { Loader2, Trash2, Github, Mail, Layout, Info, Layers, CheckCircle2, X, Copy, Activity, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
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
      
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc, plan, githubRepoUrl })
      });
      
      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error);
      
      const newProjectId = projectData.project.id;

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
        window.location.reload();
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreateProjectLoading(false);
    }
  }

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex flex-col gap-4">
          <h1 className="text-5xl md:text-7xl font-[900] tracking-tighter uppercase italic leading-none border-l-8 border-black pl-8">
            PROJECTS <br />
            <span className="bg-[#FFD700] border-4 border-black px-4 shadow-[6px_6px_0_0_black]">INFRA_UNITS</span>
          </h1>
          <p className="text-black font-black uppercase text-xs tracking-widest mt-4 opacity-60 max-w-xl border-b-2 border-black/10 pb-4">
            Manage your operational containers and organization-level deployments.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-[#FFD700] text-black h-16 px-8 border-4 border-black font-[900] text-xl uppercase tracking-tighter hover:bg-black hover:text-white shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-4 active:scale-95"
        >
          <Plus className="w-6 h-6 stroke-[4px]" /> NEW_PROJECT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {initialProjects.length === 0 ? (
          <div className="col-span-full p-20 border-4 border-black border-dashed bg-white text-center shadow-[12px_12px_0_0_#F0F0F0]">
            <p className="text-2xl font-black uppercase italic opacity-20">NO_DATA_CONTAINERS_DETECTED</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-8 text-xs font-black uppercase underline underline-offset-4 decoration-2 hover:bg-black hover:text-white px-4 py-2 transition-colors"
            >
              INITIALIZE_FIRST_PROJECT
            </button>
          </div>
        ) : (
          initialProjects.map(p => (
            <div key={p.id} className="group relative">
               <div className="absolute inset-0 bg-black translate-x-3 translate-y-3 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all"></div>
               <div className="p-8 bg-white border-4 border-black flex flex-col h-full hover:translate-x-1 hover:translate-y-1 transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-[#00D1FF] border-2 border-black flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
                        <Activity className="w-6 h-6 text-black" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteProject(p.id);
                      }}
                      disabled={deleteLoadingId === p.id}
                      className="text-black/20 hover:text-[#FF3131] transition-colors p-2"
                    >
                      {deleteLoadingId === p.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                    </button>
                  </div>
                  
                  <Link href={`/dashboard/admin/projects/${p.id}`} className="block">
                    <h2 className="text-3xl font-[900] uppercase tracking-tighter italic leading-none group-hover:underline decoration-4 mb-4">
                      {p.name}
                    </h2>
                  </Link>
                  
                  <p className="text-xs font-bold text-black/60 mb-8 flex-1 line-clamp-3 italic">
                    {p.description || "NO_DESCRIPTION_PROVIDED_BY_OPERATOR"}
                  </p>
                  
                  <div className="grid grid-cols-2 border-t-2 border-black pt-6 gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-black/40">TEAMS</span>
                      <span className="text-xl font-black italic">{String(p.teams?.length || 0).padStart(2, '0')}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-black/40">MANAGERS</span>
                      <span className="text-xl font-black italic">{String(p.managers?.length || 0).padStart(2, '0')}</span>
                    </div>
                  </div>
                  
                  <Link 
                    href={`/dashboard/admin/projects/${p.id}`}
                    className="mt-8 flex items-center justify-center w-full py-4 border-2 border-black bg-black text-white font-black uppercase text-[10px] tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors"
                  >
                    ACCESS_PROJECT_NODE
                  </Link>
               </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <div className="bg-white border-8 border-black shadow-[30px_30px_0_0_black] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-8 bg-black text-white">
              <div className="flex items-center gap-4">
                <div className="p-2 bg-[#FFD700] border-2 border-white">
                  <Layout className="w-6 h-6 text-black" />
                </div>
                <h2 className="text-4xl font-[900] uppercase italic tracking-tighter">PROJECT_INIT</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-2 hover:bg-white hover:text-black transition-colors border-2 border-white"
              >
                <X className="w-8 h-8 stroke-[3px]" />
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="p-10 space-y-8 overflow-y-auto custom-scrollbar">
              <div className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Layout className="w-4 h-4" />
                      PROJECT_NAME*
                    </label>
                    <input 
                      required 
                      value={newProjectName} 
                      onChange={e=>setNewProjectName(e.target.value)} 
                      className="w-full px-6 py-4 bg-white border-4 border-black font-bold uppercase text-sm focus:outline-none focus:bg-[#00D1FF] transition-colors placeholder:text-black/20" 
                      placeholder="CORE_SYSTEM" 
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      INITIAL_MANAGER_EMAIL
                    </label>
                    <input 
                      type="email"
                      value={inviteManagerEmail} 
                      onChange={e=>setInviteManagerEmail(e.target.value)} 
                      className="w-full px-6 py-4 bg-white border-4 border-black font-bold uppercase text-sm focus:outline-none focus:bg-[#FF00FF] focus:text-white transition-colors placeholder:text-black/20" 
                      placeholder="OPERATOR@DOMAIN.COM" 
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    PROJECT_SPECS
                  </label>
                  <textarea 
                    value={newProjectDesc} 
                    onChange={e=>setNewProjectDesc(e.target.value)} 
                    rows={3}
                    className="w-full px-6 py-4 bg-white border-4 border-black font-bold uppercase text-sm focus:outline-none focus:bg-[#F0F0F0] transition-colors resize-none placeholder:text-black/20" 
                    placeholder="DEFINE_PURPOSE_OF_THIS_CONTAINER..." 
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <Layers className="w-4 h-4" />
                    TIER_SELECTION*
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                      { id: "BASIC", name: "TIER_01", desc: "INDIE_OPS", color: "bg-[#00D1FF]" },
                      { id: "ADVANCED", name: "TIER_02", desc: "UNIT_DEPLOYS", color: "bg-[#FFD700]" },
                      { id: "PRO", name: "TIER_XX", desc: "CORE_LEAGUE", color: "bg-[#FF00FF]" }
                    ].map((p) => (
                      <div 
                        key={p.id}
                        onClick={() => setPlan(p.id)}
                        className={cn(
                          "relative p-6 border-4 cursor-pointer transition-all flex flex-col items-center text-center gap-2",
                          plan === p.id 
                            ? `border-black ${p.color} shadow-none translate-x-1 translate-y-1 font-black` 
                            : 'border-black bg-white shadow-[4px_4px_0_0_black] hover:bg-[#F0F0F0]'
                        )}
                      >
                        <div className="text-lg font-black uppercase tracking-tighter italic">{p.name}</div>
                        <div className="text-[10px] font-bold uppercase tracking-widest opacity-60 leading-tight">{p.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {plan === 'PRO' ? (
                  <div className="py-12 border-4 border-black bg-black text-white flex flex-col items-center justify-center text-center space-y-4">
                    <Activity className="w-12 h-12 text-[#FF00FF] animate-pulse" />
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter">ACCESS_DENIED</h3>
                    <p className="text-xs font-bold uppercase opacity-40 max-w-[280px]">Tier_XX capabilities are currently restricted to early alpha users.</p>
                  </div>
                ) : (
                  <div className="space-y-4 pt-4 border-t-2 border-black">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <Github className="w-4 h-4" />
                        REPOSITORY_LINK*
                      </label>
                      <input 
                        type="url"
                        required
                        value={githubRepoUrl} 
                        onChange={e=>setGithubRepoUrl(e.target.value)} 
                        className="w-full px-6 py-4 bg-white border-4 border-black font-bold uppercase text-sm focus:outline-none focus:bg-[#32CD32] transition-colors placeholder:text-black/20" 
                        placeholder="HTTPS://GITHUB.COM/ORG/REPO" 
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-10 flex flex-col sm:flex-row justify-end gap-6 border-t-4 border-black bg-[#F0F0F0] -mx-10 -mb-10 p-10 mt-10">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="px-8 py-4 border-4 border-black bg-white font-black uppercase text-xs tracking-widest hover:bg-black hover:text-white transition-colors shadow-[4px_4px_0_0_black] active:shadow-none active:translate-x-1 active:translate-y-1"
                >
                  ABORT_INIT
                </button>
                <button 
                  type="submit" 
                  disabled={createProjectLoading || !newProjectName.trim() || plan === 'PRO' || (['BASIC', 'ADVANCED'].includes(plan) && !githubRepoUrl.trim())} 
                  className="px-10 py-4 bg-[#FFD700] text-black border-4 border-black font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-[6px_6px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all disabled:opacity-50"
                >
                  {createProjectLoading ? (
                    <><Loader2 className="w-4 h-4 animate-spin stroke-[3px]" /> INITIALIZING...</>
                  ) : (
                    "FINALIZE_DEPLOYMENT"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SDK API Key Modal */}
      {createdSdkKey && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80">
          <div className="bg-white border-8 border-black shadow-[40px_40px_0_0_#32CD32] w-full max-w-xl p-0 flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-[#32CD32] p-12 border-b-8 border-black flex flex-col items-center text-center">
              <div className="w-24 h-24 bg-white border-4 border-black flex items-center justify-center mb-6 shadow-[8px_8px_0_0_black]">
                <CheckCircle2 className="w-14 h-14 text-black stroke-[3px]" />
              </div>
              <h2 className="text-4xl font-[900] uppercase italic tracking-tighter text-black">PROJECT_STABLE</h2>
              <p className="text-black font-black text-xs uppercase tracking-widest mt-4">
                Operational container successfully deployed to the nexus.
              </p>
            </div>
            
            <div className="p-12 space-y-10">
              <div className="space-y-4">
                <label className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">MASTER_SDK_KEY</label>
                <div className="relative">
                  <div className="absolute inset-0 bg-black translate-x-2 translate-y-2"></div>
                  <div className="relative bg-white border-4 border-black p-6 flex items-center justify-between gap-6 overflow-hidden">
                    <code className="text-sm font-black text-black break-all select-all font-mono italic">
                       {createdSdkKey}
                    </code>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(createdSdkKey);
                        alert("API_KEY_COPIED_TO_CLIPBOARD");
                      }}
                      className="p-3 bg-black text-white hover:bg-[#FFD700] hover:text-black transition-colors"
                      title="Copy Key"
                    >
                      <Copy className="w-6 h-6" />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-[#FF3131] font-black uppercase tracking-widest text-center mt-4">
                  !!! CRITICAL: COPY KEY NOW. RECORD WILL BE PURGED FROM THIS VIEW !!!
                </p>
              </div>
              
              <div className="bg-[#F0F0F0] p-8 border-4 border-black space-y-6">
                <div className="flex items-center gap-3 text-xs font-black uppercase">
                  <div className="p-2 bg-black text-white">
                    <Layers className="w-4 h-4" />
                  </div>
                  INJECTION_GUIDE
                </div>
                <div className="text-[11px] font-bold text-black bg-white p-6 border-2 border-black overflow-x-auto whitespace-pre font-mono italic">
{`npm install @devnexus/sdk

import { DevNexus } from '@devnexus/sdk';

DevNexus.init({
  apiKey: '${createdSdkKey}',
  baseUrl: 'https://your-app.com/api/ingest'
});`}
                </div>
              </div>

              <button 
                onClick={() => {
                  setCreatedSdkKey(null);
                  window.location.reload();
                }} 
                className="w-full py-6 bg-black text-white font-black uppercase italic tracking-widest hover:bg-[#FFD700] hover:text-black transition-colors shadow-[8px_8px_0_0_#32CD32]"
              >
                CONFIRM_RECEIPT_&_CONTINUE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
