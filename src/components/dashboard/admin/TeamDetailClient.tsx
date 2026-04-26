"use client";

import { 
  Users, Layers, CheckCircle, Clock, 
  ShieldAlert,
  ArrowRight, Activity
} from "lucide-react";
import Link from "next/link";
import { formatTimeAgo, cn } from "@/lib/utils";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { useState } from "react";

interface TeamMember {
  id: string;
  email: string;
  status: string;
  role: string;
}

interface Team {
  id: string;
  name: string;
  project: { name: string; id: string };
  members: TeamMember[];
  issues: Issue[];
}

export function TeamDetailClient({ team }: { team: Team }) {
  const [viewingIssue, setViewingIssue] = useState<Issue | null>(null);
  const activeIssues = team.issues.filter(i => i.status !== "RESOLVED" && i.status !== "OPEN");
  const unassignedIssues = team.issues.filter(i => i.status === "OPEN");
  const resolvedIssues = team.issues.filter(i => i.status === "RESOLVED");

  const stats = [
    { label: "RESOURCES", value: team.members.length, icon: Users, color: "bg-[#00D1FF]" },
    { label: "UNASSIGNED", value: unassignedIssues.length, icon: Clock, color: "bg-[#FFD700]" },
    { label: "OPERATIONAL", value: activeIssues.length, icon: Activity, color: "bg-[#FF00FF]", text: "text-white" },
    { label: "STABILIZED", value: resolvedIssues.length, icon: CheckCircle, color: "bg-[#32CD32]" },
  ];

  return (
    <div className="space-y-12 pb-24">
      {/* ── Team Header ── */}
      <div className="p-10 md:p-12 border-8 border-black bg-white shadow-[16px_16px_0_0_black] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-full bg-black/5 -skew-x-12 translate-x-10 pointer-events-none"></div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="bg-black text-white px-4 py-1 text-[10px] font-black uppercase tracking-widest shadow-[4px_4px_0_0_#FFD700]">
                SECTOR_RESOURCE: {team.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-6xl md:text-8xl font-[900] tracking-tighter uppercase italic leading-none text-black break-words">
              {team.name}
            </h1>
            <p className="text-xl font-bold text-black/60 flex items-center gap-3 border-l-4 border-black pl-6 italic">
              <Layers className="w-6 h-6" /> PART_OF_<Link href={`/dashboard/admin/projects/${team.project.id}`} className="underline decoration-4 hover:bg-black hover:text-white px-2 transition-colors">{team.project.name}</Link>_PROJECT
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 shrink-0">
            {stats.map((s) => (
              <div key={s.label} className="p-6 bg-white border-4 border-black shadow-[6px_6px_0_0_black] flex flex-col items-center min-w-[120px] group hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                <div className={cn("p-2 border-2 border-black -rotate-6 group-hover:rotate-0 transition-transform mb-3 shadow-[3px_3px_0_0_black]", s.color, s.text || "text-black")}>
                  <s.icon className="w-5 h-5" />
                </div>
                <div className="text-3xl font-[900] italic leading-none mb-1">{s.value}</div>
                <div className="text-[10px] text-black/40 font-black uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        
        {/* ── Left column: Issues Lists ── */}
        <div className="lg:col-span-2 space-y-12">
          
          {/* Unassigned Issues */}
          <Section 
            title="UNASSIGNED_LOGS" 
            icon={<ShieldAlert className="w-8 h-8 text-[#FF3131]" />} 
            count={unassignedIssues.length}
            emptyText="SYSTEM_CLEAR: NO_UNASSIGNED_LOGS_DETECTED"
            accentColor="border-[#FF3131]"
          >
            <div className="space-y-6">
              {unassignedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          {/* Active Issues */}
          <Section 
            title="OPERATIONAL_STREAM" 
            icon={<Activity className="w-8 h-8 text-[#FF00FF]" />} 
            count={activeIssues.length}
            emptyText="IDLE_STATE: NO_ACTIVE_PROCESSES"
            accentColor="border-[#FF00FF]"
          >
            <div className="space-y-6">
              {activeIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          {/* Resolved Issues */}
          <Section 
            title="STABILIZED_ARCHIVE" 
            icon={<CheckCircle className="w-8 h-8 text-[#32CD32]" />} 
            count={resolvedIssues.length}
            emptyText="ARCHIVE_EMPTY: NO_RECORDS_FOUND"
            accentColor="border-[#32CD32]"
          >
            <div className="space-y-6">
              {resolvedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>
        </div>

        {/* ── Right column: Members ── */}
        <div className="space-y-12">
          <Section 
            title="RESOURCE_ALLOC" 
            icon={<Users className="w-8 h-8 text-[#00D1FF]" />} 
            count={team.members.length}
            emptyText="VOID_DETECTED: NO_OPERATORS_FOUND"
            accentColor="border-[#00D1FF]"
          >
            <div className="grid grid-cols-1 gap-6">
              {team.members.map((m) => (
                <div key={m.id} className="p-6 bg-white border-4 border-black group relative">
                  <div className="absolute inset-0 bg-black translate-x-1 translate-y-1 -z-10 group-hover:translate-x-0 group-hover:translate-y-0 transition-all"></div>
                  <div className="flex items-center justify-between relative z-10">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-black border-2 border-black flex items-center justify-center text-xl font-black text-[#00D1FF] rotate-3 group-hover:rotate-0 transition-transform">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-black uppercase tracking-tighter leading-none mb-1 truncate">{m.email.split('@')[0]}</p>
                        <p className="text-[10px] font-bold text-black/40 truncate italic">{m.role}</p>
                      </div>
                    </div>
                    <div className={cn("w-4 h-4 border-2 border-black", m.status === 'ACTIVE' ? 'bg-[#32CD32]' : 'bg-black')} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="p-10 border-4 border-black bg-black text-white flex flex-col items-center text-center space-y-6 rotate-1 border-dashed">
            <Activity className="w-12 h-12 text-[#FFD700] animate-pulse" />
            <p className="text-xs font-black uppercase tracking-widest opacity-40 leading-relaxed italic">
              &quot;Team nodes sync in real-time. Unauthorized access to sector logs is strictly prohibited under core protocols.&quot;
            </p>
          </div>
        </div>
      </div>

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

function Section({ title, icon, count, children, emptyText, accentColor }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode; emptyText: string; accentColor: string }) {
  return (
    <div className={cn("p-10 border-4 border-black bg-white shadow-[12px_12px_0_0_black] space-y-8", accentColor)}>
      <div className="flex items-center justify-between border-b-4 border-black pb-6">
        <h2 className="text-3xl font-[900] uppercase italic tracking-tighter flex items-center gap-4">
          {icon} {title}
        </h2>
        <span className="text-[10px] font-black bg-black text-white px-3 py-1">
          TOTAL_{count}
        </span>
      </div>
      {count === 0 ? (
        <div className="py-16 text-center border-4 border-black border-dashed bg-[#F8F8F8]">
          <p className="text-lg font-black uppercase italic opacity-20 tracking-widest">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function IssueCard({ issue, onLinkClick }: { issue: Issue; onLinkClick: () => void }) {
  const severityColors: Record<string, string> = {
    CRITICAL: "bg-[#FF3131] text-white",
    HIGH: "bg-[#FF3131] text-white shadow-[3px_3px_0_0_black]",
    MEDIUM: "bg-[#FFD700] text-black shadow-[3px_3px_0_0_black]",
    LOW: "bg-[#00D1FF] text-black shadow-[3px_3px_0_0_black]",
  };

  const statusColors: Record<string, string> = {
    ASSIGNED: "bg-black text-white",
    IN_PROGRESS: "bg-[#FF00FF] text-white",
    RESOLVED: "bg-[#32CD32] text-black",
    OPEN: "bg-white border-2 border-black",
  };

  return (
    <div className="p-6 bg-white border-4 border-black shadow-[6px_6px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div className="flex-1 space-y-3 min-w-0">
        <h3 className="text-2xl font-[900] uppercase italic tracking-tighter group-hover:underline decoration-4 truncate">
          {issue.title}
        </h3>
        <div className="flex flex-wrap items-center gap-4 text-[10px] font-black uppercase tracking-widest text-black/40 italic">
          <span className={cn("px-3 py-1 border-2 border-black", severityColors[issue.severity || ""] || "bg-white")}>
            {issue.severity}
          </span>
          <span className="flex items-center gap-2">
            <Clock className="w-4 h-4" /> {issue.createdAt ? formatTimeAgo(new Date(issue.createdAt)) : "NULL_TIME"}
          </span>
          {issue.assignedTo && (
            <span className="flex items-center gap-2 px-3 py-1 bg-black text-white border-2 border-black">
               {issue.assignedTo.email.split('@')[0]}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-6 self-end md:self-center">
        <span className={cn("text-[10px] px-4 py-2 border-2 border-black font-black uppercase tracking-widest", statusColors[issue.status || ""] || "bg-white")}>
          {issue.status ? issue.status.replace("_", " ") : "UNKNOWN"}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onLinkClick(); }}
          className="p-4 bg-black text-white border-4 border-black hover:bg-[#FFD700] hover:text-black transition-colors shadow-[4px_4px_0_0_black] hover:shadow-none translate-y-0 hover:translate-x-1 hover:translate-y-1"
        >
          <ArrowRight className="w-6 h-6 stroke-[3px]" />
        </button>
      </div>
    </div>
  );
}
