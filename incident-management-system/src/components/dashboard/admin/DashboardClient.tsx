"use client";

import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Plus } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { ActiveProjects, ProjectStats } from "@/components/dashboard/shared/ActiveProjects";
import { CreateIssueModal, ProjectData, TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
  openIssuesCount,
  breachedCount,
  resolvedTodayCount,
  recentIssues,
  activeProjects,
  allProjects,
  allTeams,
  allDevelopers
}: DashboardClientProps) {
  const router = useRouter();
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  
  const stats = [
    { title: "Open Issues", value: openIssuesCount, icon: AlertTriangle, color: "text-amber-500", bgClass: "bg-amber-500/10" },
    { title: "SLA Breached", value: breachedCount, icon: ShieldAlert, color: "text-destructive", bgClass: "bg-destructive/10" },
    { title: "Resolved Today", value: resolvedTodayCount, icon: CheckCircle, color: "text-emerald-500", bgClass: "bg-emerald-500/10" },
    { title: "Avg Resolution", value: "2.4h", icon: Clock, color: "text-blue-500", bgClass: "bg-blue-500/10" }, // Mock calculation for now
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome back, {orgName} Admin.</h1>
          <p className="text-foreground/60">Here's a live overview of your organization.</p>
        </div>
        <button 
          onClick={() => setIsCreateIssueOpen(true)}
          className="bg-foreground text-background px-4 py-2 rounded-md font-medium hover:opacity-90 transition-opacity flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Create Issue
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <StatCard key={stat.title} index={idx} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentIssues issues={recentIssues} onRowClick={(issue) => setViewingIssue(issue)} />
        </div>
        <div className="space-y-4">
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

      {viewingIssue && (
        <IssueDetailModal
          issue={viewingIssue}
          onClose={() => setViewingIssue(null)}
          allowAssign={false}
        />
      )}
    </div>
  );
}
