"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

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
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b-4 border-black pb-4">
        <h2 className="text-3xl font-[900] tracking-tighter uppercase italic leading-none text-black flex items-center gap-4">
          <div className="w-6 h-6 bg-[#00D1FF]"></div>
          ACTIVE_PROJECTS
        </h2>
      </div>

      <div className="p-8 border-4 border-black bg-white shadow-[8px_8px_0_0_black] space-y-10">
        {projects.map((project, idx) => (
          <div key={project.id} className={cn(idx !== projects.length - 1 && "border-b-2 border-black/10 pb-8")}>
            <div className="flex justify-between items-end mb-4">
              <div className="flex flex-col">
                <span className="text-xl font-black uppercase italic text-black leading-none">{project.name}</span>
                <span className="text-[10px] font-black uppercase text-black/40 mt-2 tracking-widest leading-none">
                  TEAMS_{project.teamsCount} {"//"} INCIDENTS_{project.issuesCount}
                </span>
              </div>
              <span className={cn("text-lg font-black italic tracking-tighter", project.colorClass)}>{project.slaPercentage}%_SLA</span>
            </div>
            
            <div className="w-full h-6 bg-[#F0F0F0] border-2 border-black overflow-hidden relative">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.slaPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                className={cn(
                    "absolute inset-y-0 left-0 border-r-2 border-black",
                    project.slaPercentage > 90 ? "bg-[#32CD32]" : project.slaPercentage > 75 ? "bg-[#FFD700]" : "bg-[#FF3131]"
                )} 
              />
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-[10px] font-black uppercase tracking-widest text-black/20 text-center py-8 italic border-2 border-black border-dashed">
            NO_DATA_STREAMING
          </div>
        )}
        
        {projects.length > 0 && (
          <button 
            onClick={() => window.location.href = "/dashboard/admin/projects"}
            className="w-full h-14 bg-white text-black border-4 border-black font-black uppercase text-xs tracking-widest shadow-[6px_6px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all active:bg-[#FFD700]"
          >
            SHOW_ALL_INFRASTRUCTURE
          </button>
        )}
      </div>
    </div>
  );
}
