"use client";

import { motion } from "framer-motion";
import { 
  Users, Layers, CheckCircle, Clock, 
  Mail, ShieldAlert,
  ArrowRight, Activity
} from "lucide-react";
import { formatTimeAgo } from "@/lib/utils";
import { IssueDetailModal } from "@/components/dashboard/shared/IssueDetailModal";
import { useState } from "react";

interface TeamMember {
  id: string;
  email: string;
  status: string;
  role: string;
}

interface Issue {
  id: string;
  title: string;
  description: string;
  severity: string;
  status: string;
  createdAt: string | Date;
  assignedTo?: { email: string } | null;
}

interface Team {
  id: string;
  name: string;
  project: { name: string; id: string };
  members: TeamMember[];
  issues: Issue[];
}

export function TeamDetailClient({ team }: { team: Team }) {
  const [viewingIssue, setViewingIssue] = useState<any | null>(null);
  const activeIssues = team.issues.filter(i => i.status !== "RESOLVED" && i.status !== "OPEN");
  const unassignedIssues = team.issues.filter(i => i.status === "OPEN");
  const resolvedIssues = team.issues.filter(i => i.status === "RESOLVED");

  const stats = [
    { label: "Members", value: team.members.length, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { label: "Unassigned", value: unassignedIssues.length, icon: Clock, color: "text-amber-400", bg: "bg-amber-400/10" },
    { label: "Active", value: activeIssues.length, icon: Activity, color: "text-primary", bg: "bg-primary/10" },
    { label: "Resolved", value: resolvedIssues.length, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-400/10" },
  ];

  return (
    <div className="space-y-8 pb-12">
      {/* ── Team Header ── */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-border bg-card/50 backdrop-blur-md p-8 overflow-hidden relative"
      >
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">{team.name}</h1>
            <p className="text-foreground/60 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Part of <span className="font-semibold text-primary">{team.project.name}</span> project
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s, i) => (
              <div key={s.label} className="p-3 bg-accent/10 border border-border rounded-2xl w-full flex flex-col items-center min-w-[100px]">
                <div className={`p-1.5 rounded-lg mb-1 ${s.bg}`}>
                  <s.icon className={`w-3.5 h-3.5 ${s.color}`} />
                </div>
                <div className="text-lg font-bold font-mono">{s.value}</div>
                <div className="text-[10px] text-foreground/40 font-bold uppercase tracking-widest">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* ── Left column: Issues Lists ── */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Unassigned Issues */}
          <Section 
            title="Unassigned Issues" 
            icon={<ShieldAlert className="w-5 h-5 text-amber-500" />} 
            count={unassignedIssues.length}
            emptyText="No unassigned issues."
          >
            <div className="space-y-3">
              {unassignedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          {/* Active Issues */}
          <Section 
            title="Active Issues" 
            icon={<Activity className="w-5 h-5 text-primary" />} 
            count={activeIssues.length}
            emptyText="No active issues."
          >
            <div className="space-y-3">
              {activeIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>

          {/* Resolved Issues */}
          <Section 
            title="Resolved Issues" 
            icon={<CheckCircle className="w-5 h-5 text-emerald-500" />} 
            count={resolvedIssues.length}
            emptyText="No resolved issues."
          >
            <div className="space-y-3">
              {resolvedIssues.map((i) => <IssueCard key={i.id} issue={i} onLinkClick={() => setViewingIssue(i)} />)}
            </div>
          </Section>
        </div>

        {/* ── Right column: Members ── */}
        <div className="space-y-6">
          <Section 
            title="Team Members" 
            icon={<Users className="w-5 h-5 text-primary" />} 
            count={team.members.length}
            emptyText="No members found."
          >
            <div className="grid grid-cols-1 gap-3">
              {team.members.map((m) => (
                <div key={m.id} className="p-4 rounded-2xl bg-accent/5 border border-border transition-all hover:bg-accent/10 group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-sm font-bold text-primary transition-transform group-hover:scale-105">
                        {m.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold truncate max-w-[150px]">{m.email.split('@')[0]}</p>
                        <p className="text-[10px] text-foreground/40 font-mono">{m.role}</p>
                      </div>
                    </div>
                    <div className={`w-2 h-2 rounded-full ${m.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-foreground/20'}`} />
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-primary/20 bg-primary/5 p-6 border-dashed"
          >
            <p className="text-xs text-foreground/50 leading-relaxed text-center italic">
              "Developers assigned to this team will receive all related notifications and can manage issues via their own dashboard."
            </p>
          </motion.div>
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

function Section({ title, icon, count, children, emptyText }: { title: string; icon: any; count: number; children: any; emptyText: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="rounded-3xl border border-border bg-card p-6 md:p-8 space-y-6"
    >
      <div className="flex items-center justify-between border-b border-border/50 pb-4">
        <h2 className="text-xl font-bold flex items-center gap-3">
          {icon} {title}
        </h2>
        <span className="text-[10px] font-mono font-bold tracking-widest text-foreground/20 bg-accent/5 px-2 py-1 rounded-md">
          {count} TOTAL
        </span>
      </div>
      {count === 0 ? (
        <div className="py-12 text-center rounded-2xl bg-accent/5 border border-dashed border-border flex flex-col items-center">
          <p className="text-sm text-foreground/40 italic">{emptyText}</p>
        </div>
      ) : (
        children
      )}
    </motion.div>
  );
}

function IssueCard({ issue, onLinkClick }: { issue: Issue; onLinkClick: () => void }) {
  const severityColors: Record<string, string> = {
    CRITICAL: "border-red-500/20 text-red-400 bg-red-400/5",
    HIGH: "border-orange-500/20 text-orange-400 bg-orange-400/5",
    MEDIUM: "border-amber-500/20 text-amber-400 bg-amber-400/5",
    LOW: "border-blue-500/20 text-blue-400 bg-blue-400/5",
  };

  const statusColors: Record<string, string> = {
    ASSIGNED: "bg-blue-500/10 text-blue-400",
    IN_PROGRESS: "bg-amber-500/10 text-amber-400",
    RESOLVED: "bg-emerald-500/10 text-emerald-400",
    OPEN: "bg-slate-500/10 text-slate-400",
  };

  return (
    <div className="p-4 rounded-2xl border border-border bg-accent/5 hover:border-primary/20 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 group">
      <div className="flex-1 space-y-1 min-w-0">
        <p className="font-semibold text-foreground md:text-lg group-hover:text-primary transition-colors truncate">
          {issue.title}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-xs text-foreground/40 font-medium">
          <span className={`px-2 py-0.5 rounded border ${severityColors[issue.severity || ""] || "border-border text-foreground/50"}`}>
            {issue.severity}
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> {formatTimeAgo(new Date(issue.createdAt))}
          </span>
          {issue.assignedTo && (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/20 border border-border">
              <Mail className="w-3 h-3" /> {issue.assignedTo.email.split('@')[0]}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 self-end md:self-center">
        <span className={`text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-tighter ${statusColors[issue.status || ""] || "bg-accent text-foreground/50"}`}>
          {issue.status.replace("_", " ")}
        </span>
        <button 
          onClick={(e) => { e.stopPropagation(); onLinkClick(); }}
          className="p-2 border border-border rounded-xl hover:bg-primary hover:text-primary-foreground group-hover:border-primary transition-all"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
