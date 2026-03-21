"use client";

import { motion } from "framer-motion";

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
      <h2 className="text-xl font-semibold text-foreground">Active Projects</h2>
      <div className="rounded-xl border border-border bg-card p-6 space-y-6">
        {projects.map((project, idx) => (
          <div key={project.id}>
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium text-foreground">{project.name}</span>
              <span className={`${project.colorClass} font-mono font-medium`}>{project.slaPercentage}% SLA</span>
            </div>
            <p className="text-xs text-foreground/50 mb-3">{project.teamsCount} Teams • {project.issuesCount} Active Issues</p>
            <div className="w-full h-2 rounded-full bg-accent overflow-hidden">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${project.slaPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 + (idx * 0.1) }}
                className={`h-full rounded-full bg-current ${project.colorClass}`} 
              />
            </div>
          </div>
        ))}
        {projects.length === 0 && (
          <div className="text-sm text-foreground/50 text-center py-4">No active projects to display.</div>
        )}
      </div>
    </div>
  );
}
