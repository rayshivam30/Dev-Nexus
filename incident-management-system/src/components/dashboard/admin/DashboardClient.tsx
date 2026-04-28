"use client";

import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Plus, Zap, Command } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { ActiveProjects, ProjectStats } from "@/components/dashboard/shared/ActiveProjects";
import { CreateIssueModal, ProjectData, TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import { fetcher } from "@/lib/utils";

interface DashboardClientProps {
  orgName: string;
  openIssuesCount: number;
  breachedCount: number;
  resolvedTodayCount: number;
  recentIssues: Issue[];
  activeProjects: ProjectStats[];
  allProjects: ProjectData[];
  allTeams: TeamData[];
  allDevelopers: DeveloperData[];
}

export function DashboardClient({
  orgName,
  openIssuesCount: initialOpenIssues,
  breachedCount: initialBreached,
  resolvedTodayCount: initialResolved,
  recentIssues: initialRecentIssues,
  activeProjects,
  allProjects,
  allTeams,
  allDevelopers
}: DashboardClientProps) {
  const router = useRouter();
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);

  // Poll for live stats and recent issues every 10 seconds
  const { data } = useSWR("/api/dashboard/stats", fetcher, {
    refreshInterval: 10000,
    fallbackData: {
      stats: {
        openIssuesCount: initialOpenIssues,
        breachedCount: initialBreached,
        resolvedTodayCount: initialResolved,
      },
      recentIssues: initialRecentIssues
    }
  });

  const { openIssuesCount, breachedCount, resolvedTodayCount } = data.stats;
  const recentIssues = data.recentIssues;

  const stats = useMemo(() => [
    { title: "Active Incidents", value: openIssuesCount, icon: AlertTriangle, color: "text-amber-400", bgClass: "" },
    { title: "SLA Breached", value: breachedCount, icon: ShieldAlert, color: "text-red-400", bgClass: "" },
    { title: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle, color: "text-emerald-400", bgClass: "" },
    { title: "Avg. Resolution", value: "2.4h", icon: Clock, color: "text-teal-400", bgClass: "" },
  ], [openIssuesCount, breachedCount, resolvedTodayCount]);

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1">
              {orgName}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
              <Zap className="w-3 h-3" /> Live
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-sm text-zinc-500 mt-1">
            Real-time telemetry from all connected infrastructure.
          </p>
        </div>

        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="flex items-center gap-2 h-11 px-6 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all"
        >
          <Plus className="w-4 h-4" /> 
          Create Issue
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      {/* Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentIssues 
            issues={recentIssues} 
            onRowClick={(issue) => router.push(`/dashboard/admin/issues/${issue.id}`)} 
          />
        </div>
        
        <div>
          <ActiveProjects projects={activeProjects} />
        </div>
      </div>

      <CreateIssueModal 
        isOpen={isCreateIssueOpen} 
        onClose={() => setIsCreateIssueOpen(false)} 
        onSuccess={() => router.refresh()}
        projects={allProjects}
        teams={allTeams}
        developers={allDevelopers}
      />
    </div>
  );
}
