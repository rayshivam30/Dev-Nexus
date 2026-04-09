import { useState } from "react";
import { Loader2, Layout, Mail, Info, Layers, X, Activity, Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectCreateModalProps {
  onClose: () => void;
  onSuccess: (sdkApiKey?: string) => void;
}

export function ProjectCreateModal({ onClose, onSuccess }: ProjectCreateModalProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [inviteManagerEmail, setInviteManagerEmail] = useState("");
  const [plan, setPlan] = useState("BASIC");
  const [githubRepoUrl, setGithubRepoUrl] = useState("");
  const [createProjectLoading, setCreateProjectLoading] = useState(false);

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

      onSuccess(projectData.project?.sdkApiKey);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreateProjectLoading(false);
    }
  }

  return (
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
            onClick={onClose} 
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
              onClick={onClose} 
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
  );
}
