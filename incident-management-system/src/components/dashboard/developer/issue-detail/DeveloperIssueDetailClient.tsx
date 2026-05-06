"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, Send, Clock, MessageSquare, ShieldAlert, 
  BarChart2, Timer,Lightbulb, 
  ChevronRight, CheckCircle, ArrowLeft 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Issue } from "@/components/dashboard/shared/RecentIssues";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/ToastProvider";

export interface DetailedIssue extends Issue {
  activities?: Array<{
    id: string;
    action: string;
    createdAt: string | Date;
    user?: { email: string; name?: string | null };
  }>;
  comments?: Array<{
    id: string;
    text: string;
    createdAt: string | Date;
    user?: { name?: string | null; email: string };
  }>;
}

interface DeveloperIssueDetailClientProps {
  issueId: string;
  initialIssue: DetailedIssue;
}

export function DeveloperIssueDetailClient({ issueId, initialIssue }: DeveloperIssueDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [issue, setIssue] = useState<DetailedIssue>(initialIssue);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvingSubmit, setResolvingSubmit] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState("");

  useEffect(() => {
    async function fetchIssueDetails() {
      try {
        const token = localStorage.getItem("incident_token") || "";
        const res = await fetch(`/api/issues/${issueId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.ok) {
          setIssue(data.issue);
        }
      } catch (err) {
        console.error("Failed to fetch details:", err);
      }
    }

    fetchIssueDetails();
  }, [issueId]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    setCommenting(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentText("");
        showToast({
          tone: "success",
          title: "Comment added",
          description: "Your update was posted to the issue.",
        });
        const resDetail = await fetch(`/api/issues/${issue.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataDetail = await resDetail.json();
        if (resDetail.ok) setIssue(dataDetail.issue);
      } else {
        const data = await res.json();
        throw new Error(data.error || "Failed to add comment");
      }
    } catch (err) {
      showToast({
        tone: "error",
        title: "Comment failed",
        description: err instanceof Error ? err.message : "Failed to add comment",
      });
    } finally {
      setCommenting(false);
    }
  }

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus, rootCause })
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      
      // Refresh local data
      const resDetail = await fetch(`/api/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataDetail = await resDetail.json();
      if (resDetail.ok) setIssue(dataDetail.issue);

      showToast({
        tone: "success",
        title: newStatus === "RESOLVED" ? "Issue resolved" : "Work started",
        description: newStatus === "RESOLVED" ? "The issue has been resolved." : "The issue is now in progress.",
      });
      
      router.refresh();
    } catch (err) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Update failed",
      });
    }
  }

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue) return;
    setResolvingSubmit(true);
    try {
      await handleStatusChange(issue.id, "RESOLVED", rootCauseInput);
      setIsResolving(false);
    } finally {
      setResolvingSubmit(false);
    }
  };

  function formatTimeRemaining(deadline: Date | string | null | undefined) {
    if (!deadline) return "";
    const diff = new Date(deadline).getTime() - Date.now();
    if (diff <= 0) return "EXPIRED";
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 24 ? `${Math.floor(hours / 24)}d ${hours % 24}h` : `${hours}h ${mins}m`;
  }

  return (
    <div className="space-y-6 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-[1600px] mx-auto">
      {/* ── TOP NAV / BREADCRUMB ── */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Workspace
      </button>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Main Panel */}
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-white/[0.03] border border-white/[0.06] text-zinc-400 px-3 py-1 rounded-lg">ID: {issue.id.slice(-12)}</span>
              <span className={cn(
                 "px-3 py-1 rounded-lg border",
                 issue.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              )}>{issue.severity} Severity</span>
              <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 px-3 py-1 rounded-lg">{issue.status?.replace("_", " ")}</span>
            </div>

            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white leading-tight">
                {issue.title}
              </h1>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-zinc-400" /> Description
              </h4>
              <div className="p-6 border border-white/[0.06] bg-black/40 rounded-xl text-zinc-300 text-sm leading-relaxed whitespace-pre-wrap">
                {issue.description}
              </div>
            </div>

            {(issue.rootCause || issue.suggestedFixes) && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                 {issue.rootCause && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Root Cause</h4>
                    <div className="p-4 border border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl text-emerald-400 text-sm font-medium">
                      {issue.rootCause}
                    </div>
                  </div>
                 )}
                 {issue.suggestedFixes && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Suggested Fix</h4>
                    <div className="p-4 border border-purple-500/10 bg-purple-500/[0.02] rounded-xl text-purple-400 text-sm font-medium flex gap-3">
                       <Lightbulb className="w-5 h-5 shrink-0 text-purple-400 mt-0.5" />
                       <span>{issue.suggestedFixes}</span>
                    </div>
                  </div>
                 )}
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
             <h4 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" /> Activity stream
             </h4>
             <div className="space-y-6 pl-4 border-l border-white/[0.06] relative ml-2">
                {issue.activities?.map((act) => (
                  <div key={act.id} className="relative">
                     <div className="absolute -left-[21px] top-1.5 w-2.5 h-2.5 rounded-full bg-zinc-500 border-2 border-[#0a0a0c]" />
                     <div className="space-y-1 pl-2">
                        <p className="text-sm font-semibold text-zinc-300 leading-none">{act.action}</p>
                        <p className="text-[10px] text-zinc-500">{new Date(act.createdAt).toLocaleString()} · {act.user?.email || "SYSTEM"}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Comments Section */}
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
             <h4 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-400" /> Discussions
             </h4>
             <div className="space-y-6">
                {issue.comments?.map((comment) => (
                   <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-sm font-bold shrink-0">
                         {comment.user?.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
                            <span className="text-xs font-semibold text-zinc-400">{comment.user?.email}</span>
                            <span className="text-[10px] text-zinc-500">{new Date(comment.createdAt).toDateString()}</span>
                         </div>
                         <div className="text-sm text-zinc-300 p-4 bg-white/[0.02] border border-white/[0.06] rounded-xl leading-relaxed">
                            {comment.text}
                         </div>
                      </div>
                   </div>
                ))}

                <form onSubmit={handleAddComment} className="space-y-4 pt-4 border-t border-white/[0.06]">
                   <textarea 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full h-28 bg-black border border-white/[0.06] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-white/20 transition-colors resize-none placeholder:text-zinc-600 outline-none"
                   />
                   <div className="flex justify-end">
                      <button 
                         disabled={commenting || !commentText.trim()}
                         className="h-10 px-6 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2 disabled:opacity-50"
                      >
                         {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Comment <Send className="w-3.5 h-3.5" /></>}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="space-y-6">
           <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                 <BarChart2 className="w-5 h-5 text-zinc-400" /> Metrics
              </h4>

              <div className="space-y-4">
                  {[
                    { label: "Node Status", value: issue.status?.replace("_", " "), bg: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
                    { label: "Cluster Name", value: issue.teamName || "UNASSIGNED", bg: "bg-white/[0.03] border border-white/[0.06] text-zinc-300" },
                    { label: "Assigned Tech", value: issue.assignedToEmail || "PENDING", bg: "bg-white/[0.03] border border-white/[0.06] text-zinc-300" }
                  ].map((row) => (
                    <div key={row.label} className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">{row.label}</label>
                      <div className={cn("px-4 py-2.5 rounded-xl font-semibold text-sm", row.bg)}>
                        {row.value}
                      </div>
                    </div>
                  ))}
              </div>

              {/* SLA Section */}
              <div className="pt-6 border-t border-white/[0.06] space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-zinc-500" /> SLA Monitor
                 </h4>
                 <div className="grid grid-cols-1 gap-3">
                    {issue.responseSlaDeadline && (
                      <div className={cn(
                        "p-4 rounded-xl border",
                        issue.status !== "OPEN" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.02] border-white/[0.06] text-zinc-300"
                      )}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Response Deadline</p>
                        <p className="text-xl font-extrabold tracking-tight">
                          {issue.status !== "OPEN" ? "STABLE" : formatTimeRemaining(issue.responseSlaDeadline)}
                        </p>
                      </div>
                    )}
                    {issue.resolutionSlaDeadline && (
                      <div className={cn(
                        "p-4 rounded-xl border",
                        issue.status === "RESOLVED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/[0.02] border-white/[0.06] text-zinc-300"
                      )}>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Resolve Deadline</p>
                        <p className="text-xl font-extrabold tracking-tight">
                          {issue.status === "RESOLVED" ? "STABLE" : formatTimeRemaining(issue.resolutionSlaDeadline)}
                        </p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 space-y-4">
                 {issue.status === "ASSIGNED" && (
                  <button 
                    onClick={() => handleStatusChange(issue.id, "IN_PROGRESS")}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                  >
                    Start Work <ChevronRight className="w-4 h-4" />
                  </button>
                 )}

                 {issue.status === "IN_PROGRESS" && (
                    <div className="space-y-4">
                       {!isResolving ? (
                        <button 
                          onClick={() => setIsResolving(true)}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2"
                        >
                          Resolve Node <CheckCircle className="w-4 h-4" />
                        </button>
                       ) : (
                        <form onSubmit={handleResolveSubmit} className="space-y-4 animate-in fade-in duration-200">
                           <div className="space-y-1.5">
                              <label className="text-xs font-semibold text-emerald-400">Root Cause Log Entry</label>
                              <textarea 
                                required
                                value={rootCauseInput}
                                onChange={e => setRootCauseInput(e.target.value)}
                                placeholder="Describe root cause and resolution..."
                                className="w-full h-28 bg-black border border-white/[0.06] rounded-xl p-4 text-sm text-zinc-300 focus:outline-none focus:border-white/20 transition-colors resize-none placeholder:text-zinc-600 outline-none"
                              />
                           </div>
                           <div className="flex flex-col gap-2">
                              <button type="submit" disabled={resolvingSubmit} className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2">
                                {resolvingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Transmit Restore <ChevronRight className="w-4 h-4" /></>}
                              </button>
                              <button type="button" onClick={() => setIsResolving(false)} className="text-xs font-semibold text-zinc-500 hover:text-white underline transition-colors pt-1">Abort</button>
                           </div>
                        </form>
                       )}
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}
