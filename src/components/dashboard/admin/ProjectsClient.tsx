"use client";

import { useState } from "react";
import { Loader2, Trash2, Activity, Plus } from "lucide-react";
import { ProjectCreateModal } from "./ProjectCreateModal";
import { ProjectSdkKeyModal } from "./ProjectSdkKeyModal";
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
    </div>
  );
}
