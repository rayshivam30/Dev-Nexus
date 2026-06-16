"use client";

import { useState } from "react";
import { Loader2, Trash2, FolderKanban, Plus } from "lucide-react";
import { ProjectCreateModal } from "./ProjectCreateModal";
import { ProjectSdkKeyModal } from "./ProjectSdkKeyModal";
import Link from "next/link";
import { useToast } from "@/components/ui/ToastProvider";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

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
  const { showToast } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [createdSdkKey, setCreatedSdkKey] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  async function handleDeleteProject(id: string) {
    setDeleteLoadingId(id);
    try {
      const res = await fetch(`/api/projects?id=${id}`, {
        method: "DELETE"
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete project");
      
      showToast({
        tone: "success",
        title: "Project deleted",
        description: "The project has been deleted successfully.",
      });
      
      window.location.reload();
    } catch (error) {
      showToast({
        tone: "error",
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete project",
      });
    } finally {
      setDeleteLoadingId(null);
      setProjectToDelete(null);
    }
  }

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Projects</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your operational containers and deployments.
          </p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 h-11 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all"
        >
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {initialProjects.length === 0 ? (
          <div className="col-span-full p-16 border border-white/[0.06] border-dashed rounded-2xl bg-white/[0.02] text-center">
            <p className="text-sm text-zinc-500">No projects found</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="mt-4 text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
            >
              Create your first project
            </button>
          </div>
        ) : (
          initialProjects.map(p => (
            <div key={p.id} className="group rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/[0.1] transition-all flex flex-col">
               <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                        <FolderKanban className="w-5 h-5 text-emerald-400" />
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProjectToDelete(p.id);
                      }}
                      disabled={deleteLoadingId === p.id}
                      className="text-zinc-700 hover:text-red-400 transition-colors p-1"
                    >
                      {deleteLoadingId === p.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </button>
                  </div>
                  
                  <Link href={`/dashboard/admin/projects/${p.id}`} className="block">
                    <h2 className="text-lg font-bold tracking-tight group-hover:text-emerald-400 transition-colors mb-1">
                      {p.name}
                    </h2>
                  </Link>
                  
                  <p className="text-xs text-zinc-600 mb-6 line-clamp-2">
                    {p.description || "No description provided"}
                  </p>
                  
                  <div className="flex items-center gap-6 text-xs text-zinc-500">
                    <div>
                      <span className="text-white font-bold text-sm">{p.teams?.length || 0}</span>
                      <span className="ml-1 text-zinc-600">teams</span>
                    </div>
                    <div>
                      <span className="text-white font-bold text-sm">{p.managers?.length || 0}</span>
                      <span className="ml-1 text-zinc-600">managers</span>
                    </div>
                  </div>
               </div>
                  
               <Link 
                 href={`/dashboard/admin/projects/${p.id}`}
                 className="m-4 mt-0 flex items-center justify-center py-2.5 rounded-xl text-sm font-medium text-zinc-500 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white transition-all"
               >
                 Open project
               </Link>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <ProjectCreateModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={(sdkApiKey) => {
            setIsModalOpen(false);
            if (sdkApiKey) {
              setCreatedSdkKey(sdkApiKey);
            } else {
              window.location.reload();
            }
          }}
        />
      )}

      {createdSdkKey && (
        <ProjectSdkKeyModal
          sdkKey={createdSdkKey}
          onConfirm={() => {
            setCreatedSdkKey(null);
            window.location.reload();
          }}
        />
      )}

      <ConfirmDialog
        isOpen={projectToDelete !== null}
        title="Delete Project"
        description="Are you sure you want to delete this project? All associated teams and issues might be affected. This action cannot be undone."
        confirmText="Delete"
        isDangerous={true}
        isLoading={deleteLoadingId !== null}
        onConfirm={() => {
          if (projectToDelete) {
            handleDeleteProject(projectToDelete);
          }
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
