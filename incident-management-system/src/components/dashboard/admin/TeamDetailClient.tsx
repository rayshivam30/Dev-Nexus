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
    { label: "Members", value: team.members.length, icon: Users },
    { label: "Unassigned", value: unassignedIssues.length, icon: Clock },
    { label: "In Progress", value: activeIssues.length, icon: Activity },
    { label: "Resolved", value: resolvedIssues.length, icon: CheckCircle },
  ];

  return (
    <div className="space-y-8 pb-24">
      {/* ── Team Header ── */}
      <div className="p-8 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] px-2.5 py-1 rounded-lg text-zinc-500">
                ID: {team.id.slice(0, 8)}
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {team.name}
            </h1>
            <p className="text-sm text-zinc-500 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Part of{" "}
              <Link href={`/dashboard/admin/projects/${team.project.id}`} className="text-white hover:underline">
                {team.project.name}
              </Link>
            </p>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
            {stats.map((s) => (
              <div key={s.label} className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] text-center min-w-[100px]">
                <s.icon className="w-4 h-4 text-zinc-600 mx-auto mb-2" />
                <div className="text-xl font-extrabold">{s.value}</div>
                <div className="text-[10px] text-zinc-600 mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── Left column: Issues Lists ── */}
        <div className="lg:col-span-2 space-y-6">
          
          <Section 
            title="Unassigned" 
            icon={<ShieldAlert className="w-4 h-4 text-zinc-600" />} 
            count={unassignedIssues.length}
            emptyText="No unassigned issues"
          >
            <div className="space-y-2">
              {unassignedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          <Section 
            title="In Progress" 
            icon={<Activity className="w-4 h-4 text-zinc-600" />} 
            count={activeIssues.length}
            emptyText="No active issues"
          >
            <div className="space-y-2">
              {activeIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          <Section 
            title="Resolved" 
            icon={<CheckCircle className="w-4 h-4 text-zinc-600" />} 
            count={resolvedIssues.length}
            emptyText="No resolved issues"
          >
            <div className="space-y-2">
              {resolvedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>
        </div>

        {/* ── Right column: Members ── */}
        <div className="space-y-6">
          <Section 
            title="Team Members" 
            icon={<Users className="w-4 h-4 text-zinc-600" />} 
            count={team.members.length}
            emptyText="No members assigned"
          >
            <div className="space-y-2">
              {team.members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 bg-white/[0.06] rounded-lg flex items-center justify-center text-sm font-bold text-zinc-400">
                      {m.email[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{m.email.split('@')[0]}</p>
                      <p className="text-[10px] text-zinc-600">{m.role}</p>
                    </div>
                  </div>
                  <span className={cn(
                    "w-2 h-2 rounded-full",
                    m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-zinc-700'
                  )} />
                </div>
              ))}
            </div>
          </Section>
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

function Section({ title, icon, count, children, emptyText }: { title: string; icon: React.ReactNode; count: number; children: React.ReactNode; emptyText: string }) {
  return (
    <div className="p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold flex items-center gap-2">
          {icon} {title}
        </h2>
        <span className="text-xs text-zinc-600 bg-white/[0.04] px-2.5 py-1 rounded-md">{count}</span>
      </div>
      {count === 0 ? (
        <div className="py-10 text-center rounded-xl border border-dashed border-white/[0.06]">
          <p className="text-sm text-zinc-700">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </div>
  );
}

function IssueCard({ issue, onLinkClick }: { issue: Issue; onLinkClick: () => void }) {
  const severityColors: Record<string, string> = {
    CRITICAL: "text-red-400 bg-red-500/10",
    HIGH: "text-orange-400 bg-orange-500/10",
    MEDIUM: "text-amber-400 bg-amber-500/10",
    LOW: "text-zinc-400 bg-white/[0.04]",
  };

  const statusColors: Record<string, string> = {
    ASSIGNED: "text-white bg-white/[0.06]",
    IN_PROGRESS: "text-amber-400 bg-amber-500/10",
    RESOLVED: "text-emerald-400 bg-emerald-500/10",
    OPEN: "text-zinc-400 bg-white/[0.04]",
  };

  return (
    <div 
      className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl bg-white/[0.01] border border-white/[0.04] hover:bg-white/[0.03] transition-all cursor-pointer"
      onClick={onLinkClick}
    >
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold truncate mb-1.5">{issue.title}</h3>
        <div className="flex flex-wrap items-center gap-2 text-[10px]">
          <span className={cn("px-2 py-0.5 rounded-md font-medium", severityColors[issue.severity || ""] || "")}>
            {issue.severity}
          </span>
          <span className="text-zinc-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {issue.createdAt ? formatTimeAgo(new Date(issue.createdAt)) : "—"}
          </span>
          {issue.assignedTo && (
            <span className="text-zinc-500">{issue.assignedTo.email.split('@')[0]}</span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 self-end md:self-center">
        <span className={cn("text-[10px] px-2 py-0.5 rounded-md font-medium", statusColors[issue.status || ""] || "")}>
          {issue.status ? issue.status.replace("_", " ") : "Unknown"}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onLinkClick(); }}
          className="p-2 text-zinc-600 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
