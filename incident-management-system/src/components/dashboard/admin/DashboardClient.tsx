"use client";

import { ShieldAlert, CheckCircle, Clock, AlertTriangle, Plus, Zap, Terminal } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { ActiveProjects, ProjectStats } from "@/components/dashboard/shared/ActiveProjects";
import { CreateIssueModal, ProjectData, TeamData, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
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

  const stats = [
    { title: "LIVE_INCIDENTS", value: openIssuesCount, icon: AlertTriangle, color: "text-black", bgClass: "bg-[#FFD700]" },
    { title: "BREACH_CRITICAL", value: breachedCount, icon: ShieldAlert, color: "text-white", bgClass: "bg-[#FF3131]" },
    { title: "STABILIZED_24H", value: resolvedTodayCount, icon: CheckCircle, color: "text-black", bgClass: "bg-[#32CD32]" },
    { title: "SYSTEM_LATENCY", value: "2.4h", icon: Clock, color: "text-black", bgClass: "bg-[#00D1FF]" },
  ];

  return (
    <div className="space-y-16 pb-24 max-w-[1600px] mx-auto">
      {/* ── MASSIVE HEADER BOARD ── */}
      <div className="relative group p-1 bg-black border-4 border-black shadow-[16px_16px_0_0_black]">
        <div className="bg-white border-4 border-black p-8 md:p-12 relative overflow-hidden">
          {/* Decorative Corner Element */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFD700] border-l-4 border-b-4 border-black -mr-16 -mt-16 rotate-45 group-hover:rotate-0 transition-transform duration-500"></div>
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
            <div className="space-y-8 max-w-3xl">
              <div className="flex flex-wrap gap-4">
                <span className="bg-black text-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap className="w-4 h-4 text-[#FFD700]" /> SYSTEM_NODE: {orgName}_ROOT_ACCESS
                </span>
                <span className="bg-[#00D1FF] border-2 border-black px-4 py-2 text-[10px] font-black uppercase tracking-[0.3em] shadow-[4px_4px_0_0_black]">
                  SECTOR: ADMIN_OVERRIDE
                </span>
              </div>
              
              <h1 className="text-6xl md:text-8xl font-[900] tracking-tighter uppercase italic leading-none text-black break-words">
                OPERATIONAL <br />
                <span className="bg-black text-white px-6 inline-block mt-4 -rotate-1 skew-x-3 group-hover:rotate-0 group-hover:skew-x-0 transition-all duration-300">
                  DIAGNOSTICS_
                </span>
              </h1>
              
              <div className="flex items-center gap-6 p-6 bg-[#F8F8F8] border-l-8 border-black text-black">
                <Terminal className="w-10 h-10 shrink-0" />
                <p className="text-sm font-black uppercase tracking-widest opacity-60 leading-tight">
                  Real-time telemetry from all connected infrastructure. Monitoring active packets and SLA response buffers in high-precision mode.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsCreateIssueOpen(true)}
              className="w-full xl:w-auto h-24 px-12 bg-[#FFD700] text-black border-4 border-black font-[900] text-2xl uppercase italic tracking-tighter hover:bg-black hover:text-white shadow-[12px_12px_0_0_black] hover:shadow-none hover:translate-x-2 hover:translate-y-2 transition-all flex items-center justify-center gap-6 active:scale-95 group"
            >
              <Plus className="w-10 h-10 stroke-[4px] group-hover:rotate-90 transition-transform" /> 
              <span>INIT_MANUAL_LOG</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── STATS BOARD ── */}
      <div className="bg-black border-4 border-black p-1 shadow-[20px_20px_0_0_#00D1FF]">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-1 bg-black">
          {stats.map((stat, idx) => (
            <div key={stat.title} className="bg-white p-2">
               <StatCard index={idx} {...stat} />
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-8">
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_black]">
            <RecentIssues 
              issues={recentIssues} 
              onRowClick={(issue) => router.push(`/dashboard/admin/issues/${issue.id}`)} 
            />
          </div>
        </div>
        
        <div className="space-y-12">
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
