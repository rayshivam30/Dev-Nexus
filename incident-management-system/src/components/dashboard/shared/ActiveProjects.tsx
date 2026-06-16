"use client";

import { motion } from "framer-motion";
import { FolderKanban } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "./EmptyState";

export interface ProjectStats {
  id: string;
  name: string;
  teamsCount: number;
  issuesCount: number;
  slaPercentage: number;
  colorClass: string;
}

export function ActiveProjects({ projects }: { projects: ProjectStats[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <h2 className="text-lg font-bold tracking-tight">Active Projects</h2>
      </div>

      <div className="space-y-3">
        {projects.map((project, idx) => (
          <div key={project.id} className="p-4 rounded-xl border border-white/[0.06] bg-white/[0.02] hover-card-polish">
            <div className="flex justify-between items-center mb-3">
              <div>
                <span className="text-sm font-semibold text-white">{project.name}</span>
                <div className="text-[10px] text-zinc-600 mt-0.5">
                  {project.teamsCount} teams · {project.issuesCount} incidents
                </div>
              </div>
              <span className={cn(
                "text-sm font-bold",
                project.slaPercentage > 90 ? "text-emerald-400" : project.slaPercentage > 75 ? "text-amber-400" : "text-red-400"
              )}>
                {project.slaPercentage}%
              </span>
            </div>
            
            <div className="w-full h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.slaPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                className={cn(
                    "h-full rounded-full",
                    project.slaPercentage > 90 ? "bg-emerald-500" : project.slaPercentage > 75 ? "bg-amber-500" : "bg-red-500"
                )} 
              />
            </div>
          </div>
        ))}
        
        {projects.length === 0 && (
          <EmptyState
            icon={FolderKanban}
            title="No projects yet"
            description="Create your first project to start tracking incidents across your infrastructure."
          />
        )}
        
        {projects.length > 0 && (
          <button 
            onClick={() => window.location.href = "/dashboard/admin/projects"}
            className="w-full py-2.5 rounded-xl text-sm font-medium text-zinc-500 border border-white/[0.06] hover:bg-white/[0.03] hover:text-white transition-all"
          >
            View all projects
          </button>
        )}
      </div>
    </div>
  );
}
