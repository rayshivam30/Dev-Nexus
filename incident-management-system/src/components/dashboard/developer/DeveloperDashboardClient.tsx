"use client";

import { AlertTriangle, CheckCircle, Clock, Activity, Plus, Zap, Terminal } from "lucide-react";
import { StatCard } from "@/components/dashboard/shared/StatCard";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { CreateIssueModal, DeveloperData } from "@/components/dashboard/shared/CreateIssueModal";
import { useState } from "react";
import { useRouter } from "next/navigation";

interface DeveloperDashboardClientProps {
  developerEmail: string;
  teamName: string;
  teamId?: string | null;
  projectId?: string | null;
  openCount: number;
  inProgressCount: number;
  resolvedCount: number;
  recentIssues: Issue[];
  allDevelopers: DeveloperData[];
}

export function DeveloperDashboardClient({
  developerEmail,
  teamName,
  teamId,
  projectId,
  openCount,
  inProgressCount,
  resolvedCount,
  recentIssues,
  allDevelopers,
}: DeveloperDashboardClientProps) {
  const router = useRouter();
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);


  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          status: newStatus,
          rootCause: rootCause 
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  const stats = [
    { title: "ASSIGNED_TASKS", value: openCount + inProgressCount, icon: AlertTriangle, color: "text-black", bgClass: "bg-[#FFD700]" },
    { title: "IN_PROGRESS", value: inProgressCount, icon: Activity, color: "text-white", bgClass: "bg-[#00D1FF]" },
    { title: "STABILIZED_NODES", value: resolvedCount, icon: CheckCircle, color: "text-black", bgClass: "bg-[#32CD32]" },
    { title: "RESPONSE_PENDING", value: openCount, icon: Clock, color: "text-white", bgClass: "bg-[#FF3131]" },
  ];

  return (
    <div className="space-y-16 pb-24 max-w-[1500px] mx-auto">
      {/* ── MASSIVE HEADER BOARD ── */}
      <div className="relative group">
        {/* Outer Shadow Layer */}
        <div className="absolute inset-0 bg-black translate-x-4 translate-y-4 -z-10 group-hover:translate-x-2 group-hover:translate-y-2 transition-all"></div>
        
        <div className="bg-white border-4 border-black p-8 md:p-12 relative overflow-hidden">
          {/* Aesthetic UI Lines */}
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#FFD700] border-l-4 border-b-4 border-black rotate-45 -mr-12 -mt-12"></div>
          <div className="absolute bottom-4 left-4 flex gap-1">
             <div className="w-1 h-1 bg-black/20"></div>
             <div className="w-1 h-1 bg-black/20"></div>
             <div className="w-1 h-1 bg-black/20"></div>
          </div>
          
          <div className="relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
            <div className="space-y-10 max-w-3xl">
              <div className="flex flex-wrap gap-3">
                <span className="bg-black text-white px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-[#FFD700]" /> NODE: {teamName || "SYS"}_WORKSPACE
                </span>
                <span className="bg-[#00D1FF] border-2 border-black px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em]">
                  USER: {developerEmail.split('@')[0].toUpperCase()}
                </span>
                <span className="border-2 border-black/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.3em] text-black/40">
                  SEC_LEVEL: 04
                </span>
              </div>
              
              <div className="space-y-2">
                <p className="text-black/40 font-black text-xs uppercase tracking-[0.4em] mb-4 flex items-center gap-2">
                  <span className="w-8 h-[2px] bg-black/10"></span> SYSTEM_OVERVIEW_MOD_01
                </p>
                <h1 className="text-6xl md:text-7xl lg:text-8xl font-[1000] tracking-tighter uppercase italic leading-[0.8] text-black">
                  ENGINEER <br />
                  <span className="relative">
                    WORKSPACE_
                    <div className="absolute -bottom-2 left-0 w-full h-4 bg-[#FFD700] -z-10 -rotate-1"></div>
                  </span>
                </h1>
              </div>
              
              <div className="flex items-start gap-4 p-5 bg-[#F8F8F8] border-l-8 border-black text-black max-w-2xl">
                <Terminal className="w-6 h-6 shrink-0 mt-1 opacity-40" />
                <p className="text-[11px] font-black uppercase tracking-widest opacity-60 leading-relaxed">
                  Active session established. Monitoring stream diagnostics for {teamName || "global"} sector. 
                  SLA response buffers are currently stable.
                </p>
              </div>
            </div>

            <button 
              onClick={() => setIsCreateIssueOpen(true)}
              className="w-full xl:w-auto h-20 px-10 bg-[#FFD700] text-black border-4 border-black font-[900] text-xl uppercase italic tracking-tighter hover:bg-black hover:text-white shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center justify-center gap-6 active:scale-95 group"
            >
              <Plus className="w-8 h-8 stroke-[4px] group-hover:rotate-90 transition-transform" /> 
              <span>INIT_LOG_ENTRY</span>
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

      <div className="space-y-8">
        <div className="bg-white border-4 border-black p-8 shadow-[12px_12px_0_0_black]">
          <RecentIssues 
            issues={recentIssues} 
            onStatusChange={handleStatusChange} 
            onRowClick={(issue) => router.push(`/dashboard/developer/issues/${issue.id}`)} 
          />
        </div>
      </div>

      <CreateIssueModal 
        isOpen={isCreateIssueOpen} 
        onClose={() => setIsCreateIssueOpen(false)} 
        onSuccess={() => router.refresh()}
        fixedProjectId={projectId || undefined}
        fixedTeamId={teamId || undefined}
        developers={allDevelopers}
      />
    </div>
  );
}
