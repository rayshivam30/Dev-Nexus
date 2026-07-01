import { useState } from "react";
import { Loader2, Layout, Mail, Info, Layers, X, Github, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { startGithubAppInstall } from "@/lib/github-install";

interface ProjectCreateModalProps {
  onClose: () => void;
  onSuccess: (sdkApiKey?: string, projectId?: string) => void;
}

export function ProjectCreateModal({ onClose, onSuccess }: ProjectCreateModalProps) {
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [inviteManagerEmail, setInviteManagerEmail] = useState("");
  const [plan, setPlan] = useState("BASIC");
  const [createProjectLoading, setCreateProjectLoading] = useState(false);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdSdkKey, setCreatedSdkKey] = useState<string | null>(null);

  async function handleCreateProject(e: React.FormEvent) {
    e.preventDefault();
    setCreateProjectLoading(true);
    try {
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newProjectName, description: newProjectDesc, plan })
      });
      
      const projectData = await projectRes.json();
      if (!projectRes.ok) throw new Error(projectData.error);
      
      const newProjectId = projectData.project.id;
      setCreatedProjectId(newProjectId);
      setCreatedSdkKey(projectData.project?.sdkApiKey);

      if (inviteManagerEmail.trim()) {
        const inviteRes = await fetch("/api/auth/invite", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: inviteManagerEmail.trim(),
            role: "MANAGER",
            projectId: newProjectId
          })
        });
        const inviteData = await inviteRes.json();
        if (!inviteRes.ok) throw new Error(`Project created, but failed to invite manager: ${inviteData.error}`);
      }

      // Always stay in modal to show GitHub install step
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create project");
    } finally {
      setCreateProjectLoading(false);
    }
  }

  const handleConnectGitHub = async () => {
      if (!createdProjectId) return;
      try {
        await startGithubAppInstall(createdProjectId);
      } catch (error) {
        alert(error instanceof Error ? error.message : "Failed to start GitHub connection");
        return;
      }
      onSuccess(createdSdkKey || undefined, createdProjectId || undefined);
  };

  const inputClass = "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-emerald-500/50 focus:bg-white/[0.05] transition-all text-sm text-white placeholder:text-zinc-700";

  // Step 2: GitHub connection step (shown after project is created)
  if (createdProjectId) {
      return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
          <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-lg p-10 text-center space-y-6 animate-in zoom-in-95">
             <div className="w-16 h-16 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl mx-auto flex items-center justify-center">
                <Check className="w-8 h-8 text-emerald-400" />
             </div>
             <div className="space-y-2">
                <h2 className="text-2xl font-extrabold tracking-tight">Project Created</h2>
                <p className="text-sm text-zinc-500">Connect your GitHub repository to enable automatic incident tracking from CI failures, PR conflicts, and more.</p>
             </div>
             
             <div className="space-y-3">
                <button 
                  onClick={handleConnectGitHub}
                  className="w-full py-3.5 bg-white text-black rounded-xl text-sm font-semibold hover:bg-white/90 transition-all flex items-center justify-center gap-3"
                >
                  <Github className="w-5 h-5" />
                  Install GitHub App
                </button>
                <button 
                  onClick={() => onSuccess(createdSdkKey || undefined, createdProjectId)}
                  className="text-xs text-zinc-600 hover:text-white transition-colors"
                >
                  Skip — I&apos;ll connect later
                </button>
             </div>

             <p className="text-[10px] text-zinc-700">You can always connect GitHub from your project settings.</p>
          </div>
        </div>
      );
  }

  // Step 1: Project creation form
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/70 backdrop-blur-md">
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center">
              <Layout className="w-4 h-4 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold tracking-tight">New Project</h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleCreateProject} className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 ml-1 flex items-center gap-1.5">
                <Layout className="w-3 h-3" /> Project name *
              </label>
              <input 
                required value={newProjectName} onChange={e=>setNewProjectName(e.target.value)} 
                className={inputClass} placeholder="My Project" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-zinc-500 ml-1 flex items-center gap-1.5">
                <Mail className="w-3 h-3" /> Manager email (optional)
              </label>
              <input 
                type="email" value={inviteManagerEmail} onChange={e=>setInviteManagerEmail(e.target.value)} 
                className={inputClass} placeholder="manager@company.com" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 ml-1 flex items-center gap-1.5">
              <Info className="w-3 h-3" /> Description
            </label>
            <textarea 
              value={newProjectDesc} onChange={e=>setNewProjectDesc(e.target.value)} rows={3}
              className={cn(inputClass, "resize-none")} placeholder="Describe this project..." 
            />
          </div>

          <div className="space-y-3">
            <label className="text-xs font-medium text-zinc-500 ml-1 flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Plan *
            </label>
            <div className="grid grid-cols-2 gap-6">
              {[
                { id: "BASIC", name: "Basic", desc: "Indie" },
                { id: "ADVANCED", name: "Advanced", desc: "Teams" }
              ].map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setPlan(p.id)}
                  className={cn(
                    "p-4 rounded-xl border cursor-pointer transition-all text-center",
                    plan === p.id 
                      ? "border-emerald-500/40 bg-emerald-500/10 text-white" 
                      : "border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:bg-white/[0.04]"
                  )}
                >
                  <div className="text-sm font-bold">{p.name}</div>
                  <div className="text-[10px] text-zinc-600 mt-0.5">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
            <button type="button" onClick={onClose} 
              className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] transition-all">
              Cancel
            </button>
            <button type="submit" disabled={createProjectLoading || !newProjectName.trim()} 
              className="px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all disabled:opacity-50 flex items-center gap-2">
              {createProjectLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</>
              ) : (
                "Create Project"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

