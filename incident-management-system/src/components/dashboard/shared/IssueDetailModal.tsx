"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Send, Clock, MessageSquare, ShieldAlert, Globe, BarChart2, Timer, AlertTriangle, Github, Sparkles, Lightbulb } from "lucide-react";

import { Issue } from "./RecentIssues";

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
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [loading, setLoading] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignDevId, setAssignDevId] = useState("");
  
  // Resolution state
  const [isResolving, setIsResolving] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState("");
  const [resolvingSubmit, setResolvingSubmit] = useState(false);

  useEffect(() => {
    async function fetchIssueDetails(id: string) {
      setLoading(true);
      try {
        const token = localStorage.getItem("incident_token") || "";
        const res = await fetch(`/api/issues/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issue.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ text: commentText })
      });
      if (res.ok) {
        setCommentText("");
        // Trigger a re-fetch of details by re-setting the issue id
        if (initialIssue) {
          const resDetail = await fetch(`/api/issues/${issue.id}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const dataDetail = await resDetail.json();
          if (resDetail.ok) setIssue(dataDetail.issue);
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
    } finally {
      setCommenting(false);
    }
  }

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAssignSubmit) {
      await onAssignSubmit(assignTeamId, assignDevId);
      // Refresh
      const token = localStorage.getItem("incident_token") || "";
      if (issue) {
        const resDetail = await fetch(`/api/issues/${issue.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
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
      // Refresh
      const token = localStorage.getItem("incident_token") || "";
      const resDetail = await fetch(`/api/issues/${issue.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataDetail = await resDetail.json();
      if (resDetail.ok) setIssue(dataDetail.issue);
    } finally {
      setResolvingSubmit(false);
    }
  };

  if (!initialIssue) return null;

  const showAssignForm = allowAssign && issue?.status === "OPEN";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-card w-full max-w-4xl rounded-3xl border border-border shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col md:flex-row max-h-[90vh]">
        
        {/* Left Side: Info & Timeline & Comments */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">{issue?.title || initialIssue.title}</h2>
              <div className="flex flex-wrap gap-2 text-[10px] uppercase font-bold tracking-widest">
                <span className={`px-2 py-0.5 rounded border border-border/50 bg-foreground/5 text-foreground/60`}>
                  ID: {initialIssue.id.slice(-8)}
                </span>
                <span className={`px-2 py-0.5 rounded border ${
                    (issue?.severity || initialIssue.severity) === 'CRITICAL' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                  }`}>
                  {issue?.severity || initialIssue.severity}
                </span>
                {issue?.priority && (
                  <span className={`px-2 py-0.5 rounded border bg-amber-500/10 text-amber-500 border-amber-500/20`}>
                    {issue.priority} PRIORITY
                  </span>
                )}
                 {issue?.environment && (
                  <span className={`px-2 py-0.5 rounded border bg-blue-500/10 text-blue-500 border-blue-500/20`}>
                    {issue.environment}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors md:hidden">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/80 lowercase tracking-tighter italic">
              <ShieldAlert className="w-4 h-4" /> description
            </h4>
            <div className="text-sm text-foreground/70 bg-foreground/[0.02] border border-border/30 p-5 rounded-2xl whitespace-pre-wrap leading-relaxed shadow-inner">
              {issue?.description || initialIssue.description}
            </div>
          </div>

          {issue?.rootCause && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-emerald-500 lowercase tracking-tighter italic">
                <Globe className="w-4 h-4" /> root cause analysis
              </h4>
              <div className="text-sm text-emerald-500 bg-emerald-500/5 border border-emerald-500/20 p-5 rounded-2xl italic">
                &quot;{issue.rootCause}&quot;
              </div>
            </div>
          )}

          {issue?.suggestedFixes && (
            <div className="space-y-3">
              <h4 className="text-sm font-bold flex items-center gap-2 text-purple-500 lowercase tracking-tighter italic">
                <Sparkles className="w-4 h-4" /> ai suggested fixes
              </h4>
              <div className="text-sm text-purple-500 bg-purple-500/5 border border-purple-500/20 p-5 rounded-2xl whitespace-pre-wrap leading-relaxed">
                <div className="flex gap-3">
                  <Lightbulb className="w-5 h-5 shrink-0 text-amber-500" />
                  <span>{issue.suggestedFixes}</span>
                </div>
              </div>
            </div>
          )}

          {/* Timeline / Activity Section */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/50">
              <Clock className="w-4 h-4" /> Activity Timeline
            </h4>
            <div className="space-y-4 ml-2 border-l-2 border-border/30 pl-6 pb-2">
              {loading ? (
                 <div className="flex items-center gap-2 text-xs text-foreground/30 py-4"><Loader2 className="w-3 h-3 animate-spin"/> Loading history...</div>
              ) : issue?.activities && issue.activities.length > 0 ? (
                issue.activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full bg-background border-2 border-border/50"></div>
                    <div className="text-xs">
                      <p className="text-foreground/80 font-medium">{act.action}</p>
                      <p className="text-[10px] text-foreground/40 mt-0.5">{new Date(act.createdAt).toLocaleString()} · {act.user?.email || "System"}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-foreground/30 italic">No activity recorded yet.</div>
              )}
            </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-4 pt-4 border-t border-border/50">
            <h4 className="text-sm font-bold flex items-center gap-2 text-foreground/50">
              <MessageSquare className="w-4 h-4" /> Discussion
            </h4>
            <div className="space-y-4">
              {issue?.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-foreground/5 flex items-center justify-center text-[10px] font-bold border border-border/50">
                    {comment.user?.name?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold">{comment.user?.name || comment.user?.email}</span>
                      <span suppressHydrationWarning className="text-[10px] text-foreground/40">{new Date(comment.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-sm text-foreground/70 bg-foreground/5 px-4 py-2.5 rounded-2xl rounded-tl-none border border-border/20">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex gap-2 items-start mt-4">
                <textarea 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="Ask a question or provide an update..."
                  className="flex-1 bg-foreground/5 border border-border/50 rounded-2xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-foreground/10 resize-none min-h-[80px]"
                />
                <button 
                  disabled={commenting || !commentText.trim()}
                  className="p-3 bg-foreground text-background rounded-2xl hover:opacity-90 disabled:opacity-30 transition-all flex border border-foreground/10"
                >
                  {commenting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Right Side: Sidebar / Actions */}
        <div className="w-full md:w-[320px] bg-foreground/[0.03] border-t md:border-t-0 md:border-l border-border/50 p-6 flex flex-col gap-8 shrink-0 overflow-y-auto">
          <div className="hidden md:flex justify-end">
             <button onClick={onClose} className="p-2 rounded-full hover:bg-foreground/5 text-foreground/40 hover:text-foreground transition-colors">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            <h4 className="text-xs font-bold uppercase tracking-[2px] text-foreground/30 flex items-center gap-2">
              <BarChart2 className="w-4 h-4" /> metadata
            </h4>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm border-b border-border/30 pb-3">
                <span className="text-foreground/40">Status</span>
                <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] tracking-tight border ${
                  issue?.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                }`}>
                  {(issue?.status || initialIssue.status)?.replace("_", " ")}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/30 pb-3">
                <span className="text-foreground/40">Team</span>
                <span className="font-bold tracking-tight">{issue?.team?.name || initialIssue.teamName || "Unassigned"}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-border/30 pb-3">
                <span className="text-foreground/40">Assignee</span>
                <span className="font-bold tracking-tight truncate max-w-[140px] text-right">{issue?.assignedTo?.email || initialIssue.assignedToEmail || "None"}</span>
              </div>
              {issue?.source === 'GITHUB' && (
                <div className="flex justify-between items-center text-sm border-b border-border/30 pb-3">
                  <span className="text-foreground/40">Source</span>
                  <a 
                    href={(issue.logs as { html_url?: string })?.html_url || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 font-bold text-primary hover:underline"
                  >
                    <Github className="w-3.5 h-3.5" /> GitHub
                  </a>
                </div>
              )}
            </div>

            {/* SLA Section */}
            {(issue?.responseSlaDeadline || issue?.resolutionSlaDeadline) && (
              <div className="space-y-4 pt-4 border-t border-border/30">
                <h4 className="text-xs font-bold uppercase tracking-[2px] text-purple-500 flex items-center gap-2">
                  <Timer className="w-4 h-4" /> SLA Status
                </h4>
                <div className="space-y-3">
                  {issue.responseSlaDeadline && (
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      issue.status !== "OPEN" 
                        ? (new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10")
                        : "bg-purple-500/5 border-purple-500/10"
                    }`}>
                      <p className="text-[10px] text-purple-500/60 uppercase font-bold tracking-wider">Response SLA</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {issue.status !== "OPEN" ? (
                            new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? (
                              <span className="text-emerald-500 flex items-center gap-1">Met</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1">Breached</span>
                            )
                          ) : (
                            new Date(issue.responseSlaDeadline) < new Date() ? (
                              <span className="text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Breached
                              </span>
                            ) : (
                              formatTimeRemaining(issue.responseSlaDeadline)
                            )
                          )}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] text-foreground/30">{new Date(issue.responseSlaDeadline).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}

                  {issue.resolutionSlaDeadline && (
                    <div className={`p-3 rounded-xl border space-y-1 ${
                      issue.status === "RESOLVED"
                        ? (new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "bg-emerald-500/5 border-emerald-500/10" : "bg-red-500/5 border-red-500/10")
                        : "bg-purple-500/5 border-purple-500/10"
                    }`}>
                      <p className="text-[10px] text-purple-500/60 uppercase font-bold tracking-wider">Resolution SLA</p>
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold">
                          {issue.status === "RESOLVED" ? (
                            new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? (
                              <span className="text-emerald-500 flex items-center gap-1">Met</span>
                            ) : (
                              <span className="text-red-500 flex items-center gap-1">Breached</span>
                            )
                          ) : (
                            new Date(issue.resolutionSlaDeadline) < new Date() ? (
                              <span className="text-red-500 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> Breached
                              </span>
                            ) : (
                              formatTimeRemaining(issue.resolutionSlaDeadline)
                            )
                          )}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] text-foreground/30">{new Date(issue.resolutionSlaDeadline).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Assignment Section */}
          {showAssignForm && (
            <div className="space-y-4 animate-in slide-in-from-right-4 duration-500">
               <h4 className="text-xs font-bold uppercase tracking-[2px] text-primary">Assign Issue</h4>
               <form onSubmit={handleAssign} className="space-y-3">
                  <select
                    required
                    value={assignTeamId}
                    onChange={(e) => { setAssignTeamId(e.target.value); setAssignDevId(""); }}
                    className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 transition-all font-medium"
                  >
                    <option value="">Select Team...</option>
                    {teams.filter(t => t.projectId === (issue?.projectId || initialIssue.projectId)).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>

                  {assignTeamId && (
                    <select
                      value={assignDevId}
                      onChange={(e) => setAssignDevId(e.target.value)}
                      className="w-full px-4 py-2.5 bg-background border border-border/50 rounded-xl text-sm focus:ring-2 focus:ring-primary/10 transition-all font-medium animate-in slide-in-from-top-2"
                    >
                      <option value="">(Manual Pending)</option>
                      {developers.filter(d => d.teamId === assignTeamId).map(dev => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name || dev.email}
                          {(issue?.logs as { suggestedAssigneeId?: string })?.suggestedAssigneeId === dev.id ? " (Suggested)" : ""}
                        </option>

                      ))}
                    </select>
                  )}

                  <button
                    disabled={isAssigning || !assignTeamId}
                    className="w-full py-3 bg-foreground text-background font-bold rounded-xl hover:opacity-90 disabled:opacity-30 shadow-lg shadow-foreground/10 transition-all active:scale-[0.98]"
                  >
                    {isAssigning ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Confirm Assignment"}
                  </button>
               </form>
            </div>
          )}

          {/* Standard Status Controls (For Developers / Progress) */}
          {issue?.status === "ASSIGNED" && onStatusChange && !showAssignForm && (
            <button
               onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
               className="w-full py-3 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all"
            >
              Start Progress
            </button>
          )}

          {issue?.status === "IN_PROGRESS" && onStatusChange && (
            <div className="space-y-4">
              {!isResolving ? (
                <button
                   onClick={() => setIsResolving(true)}
                   className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all"
                >
                  Resolve Issue
                </button>
              ) : (
                <form onSubmit={handleResolveSubmit} className="space-y-3 animate-in fade-in zoom-in-95 duration-200">
                  <label className="text-xs font-bold text-emerald-500 uppercase">Root Cause Analysis</label>
                  <textarea 
                    required
                    value={rootCauseInput}
                    onChange={e => setRootCauseInput(e.target.value)}
                    placeholder="Briefly describe why this happened..."
                    className="w-full bg-background border border-emerald-500/30 rounded-xl p-3 text-sm focus:ring-2 focus:ring-emerald-500/10 min-h-[100px] shadow-sm"
                  />
                  <div className="flex gap-2">
                     <button type="button" onClick={() => setIsResolving(false)} className="flex-1 py-2 text-xs font-bold text-foreground/40 hover:text-foreground">Cancel</button>
                     <button 
                      type="submit" 
                      disabled={resolvingSubmit || !rootCauseInput.trim()}
                      className="flex-[2] py-2 bg-emerald-500 text-white font-bold rounded-xl text-sm"
                     >
                        {resolvingSubmit ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Submit Fix"}
                     </button>
                  </div>
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
  if (diff <= 0) return "Overdue";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h remaining`;
  }
  return `${hours}h ${mins}m remaining`;
}
