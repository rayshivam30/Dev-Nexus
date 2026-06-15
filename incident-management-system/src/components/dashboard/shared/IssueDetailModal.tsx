"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Send, Clock, MessageSquare, ShieldAlert, Globe, BarChart2, Timer, Github, Sparkles, Lightbulb, Activity, ChevronRight, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Issue } from "./RecentIssues";
import { useToast } from "@/components/ui/ToastProvider";

export interface TeamData { id: string; name: string; projectId: string; }
export interface DeveloperData { id: string; name?: string | null; email: string; teamId: string | null; }

interface DetailedIssue extends Issue {
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

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  allowAssign?: boolean;
  teams?: TeamData[];
  developers?: DeveloperData[];
  onAssignSubmit?: (teamId: string, devId: string) => Promise<void>;
  onStatusChange?: (issueId: string, newStatus: string, rootCause?: string) => Promise<void>;
  isAssigning?: boolean;
}

export function IssueDetailModal({ 
  issue: initialIssue, 
  onClose, 
  allowAssign, 
  teams = [], 
  developers = [], 
  onAssignSubmit,
  onStatusChange,
  isAssigning 
}: IssueDetailModalProps) {
  const { showToast } = useToast();
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignDevId, setAssignDevId] = useState("");
  
  const [isResolving, setIsResolving] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState("");
  const [resolvingSubmit, setResolvingSubmit] = useState(false);

  useEffect(() => {
    async function fetchIssueDetails(id: string) {
      setLoading(true);
      try {
        const res = await fetch(`/api/issues/${id}`);
        const data = await res.json();
        if (res.ok) {
          setIssue(data.issue);
          setAssignDevId(data.issue.logs?.suggestedAssigneeId || "");
        }
      } catch (err) {
        console.error("Failed to fetch details:", err);
      } finally {
        setLoading(false);
      }
    }

    if (initialIssue) {
      fetchIssueDetails(initialIssue.id);
    } else {
      setIssue(null);
    }
  }, [initialIssue]);

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim() || !issue) return;
    setCommenting(true);
    try {
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentText("");
        showToast({
          tone: "success",
          title: "Comment added",
          description: "Your update is now attached to the issue.",
        });
        if (initialIssue) {
          const resDetail = await fetch(`/api/issues/${issue.id}`);
          const dataDetail = await resDetail.json();
          if (resDetail.ok) setIssue(dataDetail.issue);
        }
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

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAssignSubmit) {
      await onAssignSubmit(assignTeamId, assignDevId);
      if (issue) {
        const resDetail = await fetch(`/api/issues/${issue.id}`);
        const dataDetail = await resDetail.json();
        if (resDetail.ok) {
          setIssue(dataDetail.issue);
          setAssignDevId(dataDetail.issue.logs?.suggestedAssigneeId || "");
        }
      }
    }
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!issue || !onStatusChange) return;
    setResolvingSubmit(true);
    try {
      await onStatusChange(issue.id, "RESOLVED", rootCauseInput);
      setIsResolving(false);
      const resDetail = await fetch(`/api/issues/${issue.id}`);
      const dataDetail = await resDetail.json();
      if (resDetail.ok) setIssue(dataDetail.issue);
    } finally {
      setResolvingSubmit(false);
    }
  };

  if (!initialIssue) return null;

  const showAssignForm = allowAssign && issue?.status === "OPEN";
  const inputClass = "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 text-sm transition-all";

  const severityColors: Record<string, string> = {
    CRITICAL: "text-red-400 bg-red-500/10 border-red-500/20",
    HIGH: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    MEDIUM: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    LOW: "text-zinc-400 bg-white/[0.04] border-white/[0.08]",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150] flex items-center justify-center p-4 sm:p-8 overflow-y-auto">
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-5xl flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200 max-h-[90vh]">
        
        {/* Mobile header */}
        <div className="md:hidden flex justify-between items-center p-4 border-b border-white/[0.06]">
          <h2 className="text-base font-bold">Issue Details</h2>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 p-6 md:p-8 space-y-6 overflow-y-auto">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-500">
                {initialIssue.id.slice(-12)}
              </span>
              <span className={cn("text-[10px] font-medium px-2 py-0.5 rounded-md border", severityColors[issue?.severity || initialIssue.severity || ""])}>
                {issue?.severity || initialIssue.severity}
              </span>
              {issue?.environment && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                  {issue.environment}
                </span>
              )}
              {issue?.priority && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.06] text-zinc-400">
                  P{issue.priority}
                </span>
              )}
            </div>
            
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              {issue?.title || initialIssue.title}
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-zinc-500 flex items-center gap-2">
              <ShieldAlert className="w-3.5 h-3.5" /> Description
            </h4>
            <div className="text-sm text-zinc-400 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] whitespace-pre-wrap leading-relaxed">
              {issue?.description || initialIssue.description}
            </div>
          </div>

          {/* Root Cause */}
          {issue?.rootCause && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Globe className="w-3.5 h-3.5" /> Root Cause
              </h4>
              <div className="text-sm p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-emerald-300">
                {issue.rootCause}
              </div>
            </div>
          )}

          {/* AI Suggested Fix */}
          {issue?.suggestedFixes && (
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-zinc-500 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5" /> AI Suggested Fix
              </h4>
              <div className="text-sm p-4 rounded-xl bg-violet-500/5 border border-violet-500/10 text-violet-300 flex gap-3">
                <Lightbulb className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{issue.suggestedFixes}</span>
              </div>
            </div>
          )}

          {/* Activity Timeline */}
          <div className="pt-6 border-t border-white/[0.06] space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-600" /> Activity
            </h4>
            <div className="space-y-3 ml-2 border-l border-white/[0.06] pl-5">
              {loading ? (
                <div className="flex items-center gap-2 text-xs text-zinc-600 py-4"><Loader2 className="w-4 h-4 animate-spin" /> Loading...</div>
              ) : issue?.activities && issue.activities.length > 0 ? (
                issue.activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-white/10 border border-white/20" />
                    <p className="text-sm font-medium">{act.action}</p>
                    <p className="text-[10px] text-zinc-600">{new Date(act.createdAt).toLocaleString()} · {act.user?.email || "System"}</p>
                  </div>
                ))
              ) : (
                <div className="text-xs text-zinc-700">No activity recorded</div>
              )}
            </div>
          </div>

          {/* Comments */}
          <div className="pt-6 border-t border-white/[0.06] space-y-4">
            <h4 className="text-sm font-semibold flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-zinc-600" /> Comments
            </h4>
            <div className="space-y-3">
              {issue?.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3 items-start">
                  <div className="w-8 h-8 bg-white/[0.06] rounded-lg flex items-center justify-center text-xs font-bold text-zinc-400 shrink-0">
                    {comment.user?.name?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-semibold">{comment.user?.name || comment.user?.email}</span>
                      <span suppressHydrationWarning className="text-[10px] text-zinc-700">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-zinc-400 p-3 rounded-lg bg-white/[0.02] border border-white/[0.04]">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <textarea 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Add a comment..."
                  className={cn(inputClass, "flex-1 min-h-[80px] resize-none")}
                />
                <button 
                  disabled={commenting || !commentText.trim()}
                  className="self-end p-3 bg-white text-black rounded-xl hover:bg-white/90 transition-all disabled:opacity-30"
                >
                  {commenting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="w-full md:w-[320px] border-t md:border-t-0 md:border-l border-white/[0.06] p-6 md:p-8 flex flex-col gap-6 shrink-0 md:max-h-[90vh] md:overflow-y-auto bg-white/[0.01]">
          <div className="hidden md:flex justify-end">
            <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-5">
            <h4 className="text-sm font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-zinc-600" /> Details
            </h4>
            
            <div className="space-y-3">
              {[
                { label: "Status", value: (issue?.status || initialIssue.status)?.replace("_", " ") },
                { label: "Team", value: issue?.team?.name || initialIssue.teamName || "Unassigned" },
                { label: "Assignee", value: issue?.assignedTo?.email || initialIssue.assignedToEmail || "Unassigned" }
              ].map((row) => (
                <div key={row.label} className="space-y-1">
                  <label className="text-[10px] text-zinc-600">{row.label}</label>
                  <div className="px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg text-sm text-zinc-300">
                    {row.value}
                  </div>
                </div>
              ))}
              
              {issue?.source === 'GITHUB' && (
                <a 
                  href={(issue.logs as { html_url?: string })?.html_url || "#"} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 bg-white/[0.02] border border-white/[0.04] rounded-lg text-xs text-zinc-400 hover:bg-white/[0.04] transition-all"
                >
                  <span className="flex items-center gap-2"><Github className="w-3.5 h-3.5" /> View on GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>

            {/* SLA */}
            {(issue?.responseSlaDeadline || issue?.resolutionSlaDeadline) && (
              <div className="pt-5 border-t border-white/[0.06] space-y-4">
                <h4 className="text-sm font-bold flex items-center gap-2">
                  <Timer className="w-4 h-4 text-zinc-600" /> SLA
                </h4>
                {issue.responseSlaDeadline && (
                  <div className={cn(
                    "p-3 rounded-lg border space-y-1",
                    issue.status !== "OPEN" 
                      ? (new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")
                      : "border-white/[0.04] bg-white/[0.02]"
                  )}>
                    <p className="text-[10px] text-zinc-600">Response</p>
                    <p className="text-sm font-bold">
                      {issue.status !== "OPEN" ? (
                        new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "Met" : "Breached"
                      ) : (
                        new Date(issue.responseSlaDeadline) < new Date() ? "Breached" : formatTimeRemaining(issue.responseSlaDeadline)
                      )}
                    </p>
                  </div>
                )}

                {issue.resolutionSlaDeadline && (
                  <div className={cn(
                    "p-3 rounded-lg border space-y-1",
                    issue.status === "RESOLVED"
                      ? (new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "border-emerald-500/20 bg-emerald-500/5" : "border-red-500/20 bg-red-500/5")
                      : "border-white/[0.04] bg-white/[0.02]"
                  )}>
                    <p className="text-[10px] text-zinc-600">Resolution</p>
                    <p className="text-sm font-bold">
                      {issue.status === "RESOLVED" ? (
                        new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "Met" : "Breached"
                      ) : (
                        new Date(issue.resolutionSlaDeadline) < new Date() ? "Breached" : formatTimeRemaining(issue.resolutionSlaDeadline)
                      )}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Assign Form */}
          {showAssignForm && (
            <div className="pt-5 border-t border-white/[0.06] space-y-4">
              <h4 className="text-sm font-bold flex items-center gap-2">
                <Activity className="w-4 h-4 text-zinc-600" /> Assign
              </h4>
              <form onSubmit={handleAssign} className="space-y-3">
                <select
                  required
                  value={assignTeamId}
                  onChange={(e) => { setAssignTeamId(e.target.value); setAssignDevId(""); }}
                  className={cn(inputClass, "cursor-pointer")}
                >
                  <option value="">Select team...</option>
                  {teams.filter(t => t.projectId === (issue?.projectId || initialIssue.projectId)).map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                {assignTeamId && (
                  <select
                    value={assignDevId}
                    onChange={(e) => setAssignDevId(e.target.value)}
                    className={cn(inputClass, "cursor-pointer")}
                  >
                    <option value="">Select developer...</option>
                    {developers.filter(d => d.teamId === assignTeamId).map(dev => (
                      <option key={dev.id} value={dev.id}>
                        {dev.name || dev.email}
                        {(issue?.logs as { suggestedAssigneeId?: string })?.suggestedAssigneeId === dev.id ? " ★" : ""}
                      </option>
                    ))}
                  </select>
                )}

                <button
                  disabled={isAssigning || !assignTeamId}
                  className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Assign <ChevronRight className="w-4 h-4" /></>}
                </button>
              </form>
            </div>
          )}

          {/* Status Actions */}
          {issue?.status === "ASSIGNED" && onStatusChange && !showAssignForm && (
            <button
              onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
              className="w-full py-3 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-all flex items-center justify-center gap-2"
            >
              Start Working <ChevronRight className="w-4 h-4" />
            </button>
          )}

          {issue?.status === "IN_PROGRESS" && onStatusChange && (
            <div className="space-y-3">
              {!isResolving ? (
                <button
                  onClick={() => setIsResolving(true)}
                  className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                >
                  Resolve <CheckCircle className="w-4 h-4" />
                </button>
              ) : (
                <form onSubmit={handleResolveSubmit} className="space-y-3">
                  <textarea 
                    required
                    value={rootCauseInput}
                    onChange={e => setRootCauseInput(e.target.value)}
                    placeholder="Describe the root cause..."
                    className={cn(inputClass, "min-h-[100px] resize-none")}
                  />
                  <button type="button" onClick={() => setIsResolving(false)} className="w-full py-2 text-xs text-zinc-500 hover:text-white transition-colors">
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    disabled={resolvingSubmit || !rootCauseInput.trim()}
                    className="w-full py-3 bg-emerald-600 text-white rounded-xl font-semibold text-sm hover:bg-emerald-500 transition-all disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {resolvingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Submit & Resolve <ChevronRight className="w-4 h-4" /></>}
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function formatTimeRemaining(deadline: Date | string | null | undefined) {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}
