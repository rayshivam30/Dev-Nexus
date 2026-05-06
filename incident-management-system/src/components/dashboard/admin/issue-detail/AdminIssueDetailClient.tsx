"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, Send, Clock, MessageSquare, ShieldAlert, 
  BarChart2, Timer, Sparkles, Lightbulb, 
  ChevronRight, CheckCircle, ArrowLeft, 
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { useToast } from "@/components/ui/ToastProvider";

interface DetailedIssue {
  id: string;
  title: string;
  description: string;
  severity: string;
  priority?: string | null;
  environment?: string | null;
  status: string;
  rootCause?: string | null;
  suggestedFixes?: string | null;
  createdAt: string | Date;
  resolvedAt?: string | Date | null;
  acceptedAt?: string | Date | null;
  responseSlaDeadline?: string | Date | null;
  resolutionSlaDeadline?: string | Date | null;
  source?: string | null;
  logs?: Record<string, unknown> | null;
  projectId?: string | null;
  teamId?: string | null;
  team?: { id: string; name: string } | null;
  assignedToId?: string | null;
  assignedTo?: { id: string; email: string; name?: string | null } | null;
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

interface AdminIssueDetailClientProps {
  issueId: string;
  allTeams: Array<{ id: string; name: string; projectId: string }>;
  allDevelopers: Array<{ id: string; name?: string | null; email: string; teamId: string | null }>;
  viewerRole?: "ADMIN" | "MANAGER";
}

export default function AdminIssueDetailClient({
  issueId,
  allTeams,
  allDevelopers,
  viewerRole = "ADMIN",
}: AdminIssueDetailClientProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [issue, setIssue] = useState<DetailedIssue | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  const [commentText, setCommentText] = useState("");
  const [commenting, setCommenting] = useState(false);
  
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignDevId, setAssignDevId] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [isResolving, setIsResolving] = useState(false);
  const [rootCauseInput, setRootCauseInput] = useState("");
  const [resolvingSubmit, setResolvingSubmit] = useState(false);

  const fetchIssueDetail = useCallback(async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setIssue(data.issue);
        setAssignTeamId(data.issue.teamId || "");
        setAssignDevId(data.issue.assignedToId || "");
      } else {
        setError(data.error || "Failed to establish downlink connection");
      }
    } catch {
      setError("UPLINK_FAILURE: TIMEOUT_LOST_SYNC");
    } finally {
      setLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    fetchIssueDetail();
  }, [fetchIssueDetail]);

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
          description: "Your note was posted to the issue.",
        });
        fetchIssueDetail();
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

  async function handleAssign(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!issue) return;
    setIsAssigning(true);
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          teamId: assignTeamId,
          assignedToId: assignDevId || null,
          status: assignDevId ? "ASSIGNED" : "OPEN"
        })
      });
      if (res.ok) {
        showToast({
          tone: "success",
          title: assignDevId ? "Issue assigned" : "Assignment updated",
          description: assignDevId ? "The issue is now assigned to a developer." : "The team assignment was updated.",
        });
        fetchIssueDetail();
      } else {
        const data = await res.json();
        showToast({
          tone: "error",
          title: "Assignment failed",
          description: data.error || "Failed to re-allocate resources",
        });
      }
    } catch (err) {
      showToast({
        tone: "error",
        title: "Assignment failed",
        description: err instanceof Error ? err.message : "Assignment error",
      });
    } finally {
      setIsAssigning(false);
    }
  }

  async function handleStatusUpdate(newStatus: string, rootCause?: string) {
    if (!issue) return;
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issue.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ 
          status: newStatus,
          rootCause: rootCause 
        })
      });
      if (res.ok) {
        showToast({
          tone: "success",
          title: newStatus === "RESOLVED" ? "Issue resolved" : "Status updated",
          description: newStatus === "IN_PROGRESS" ? "The issue is now in progress." : `Status changed to ${newStatus.replace("_", " ").toLowerCase()}.`,
        });
        fetchIssueDetail();
      } else {
        const data = await res.json();
        throw new Error(data.error || "Status update failed");
      }
    } catch (err) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Status update error",
      });
    }
  }

  async function handleResolveSubmit(e: React.FormEvent) {
    e.preventDefault();
    setResolvingSubmit(true);
    await handleStatusUpdate("RESOLVED", rootCauseInput);
    setIsResolving(false);
    setResolvingSubmit(false);
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-400" />
        <p className="text-sm font-semibold text-zinc-400 animate-pulse">Synchronizing operation logs...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-8 border border-red-500/20 bg-red-500/10 rounded-2xl text-center flex flex-col items-center justify-center space-y-6 max-w-xl mx-auto">
        <ShieldAlert className="w-16 h-16 text-red-400" />
        <h1 className="text-2xl font-bold text-white">Data Loss Detected</h1>
        <p className="text-sm text-zinc-400">{error || "Incident target not found."}</p>
        <button onClick={() => router.back()} className="px-6 py-2.5 bg-white text-black font-semibold text-xs rounded-xl hover:bg-zinc-200 transition-all flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Return to Dashboard
        </button>
      </div>
    );
  }

  const teamsForProject = allTeams.filter(t => t.projectId === issue.projectId);
  const devsForTeam = allDevelopers.filter(d => d.teamId === assignTeamId);
  const canManageAssignment = viewerRole === "ADMIN" || viewerRole === "MANAGER";
  const canAdvanceStatus = viewerRole === "ADMIN";
  const showAssignmentPanel =
    viewerRole === "MANAGER"
      ? issue.status === "OPEN"
      : canManageAssignment && issue.status !== "RESOLVED";

  return (
    <div className="space-y-6 pb-24 max-w-[1600px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 text-sm font-semibold text-zinc-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Return to Dashboard
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-8">
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="bg-white/[0.03] border border-white/[0.06] text-zinc-400 px-3 py-1 rounded-lg">ID: {issue.id.slice(-12)}</span>
              <span className={cn(
                 "px-3 py-1 rounded-lg border",
                 issue.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              )}>{issue.severity} Severity</span>
              <span className={cn(
                 "px-3 py-1 rounded-lg border",
                 issue.status === 'RESOLVED' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
              )}>{issue.status?.replace("_", " ")}</span>
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

            {issue.suggestedFixes && (
              <div className="space-y-2 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-400 animate-pulse" /> AI Remediations
                </h4>
                <div className="p-5 border border-purple-500/10 bg-purple-500/[0.02] rounded-xl text-purple-400 text-sm font-medium flex gap-3">
                   <Lightbulb className="w-5 h-5 shrink-0 text-purple-400 mt-0.5" />
                   <div className="space-y-3 flex-1">
                      <p>{issue.suggestedFixes}</p>
                      <div className="grid grid-cols-2 gap-4 pt-2">
                        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                          <p className="text-[10px] text-zinc-500">Confidence</p>
                          <p className="text-lg font-bold text-white">94.2%</p>
                        </div>
                        <div className="p-3 bg-white/[0.02] border border-white/[0.06] rounded-lg">
                          <p className="text-[10px] text-zinc-500">Recovery Est.</p>
                          <p className="text-lg font-bold text-white">-45 min</p>
                        </div>
                      </div>
                   </div>
                </div>
              </div>
            )}

            {issue.rootCause && (
              <div className="space-y-2 pt-4">
                <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">Root Cause</h4>
                <div className="p-4 border border-emerald-500/10 bg-emerald-500/[0.02] rounded-xl text-emerald-400 text-sm font-medium">
                  {issue.rootCause}
                </div>
              </div>
            )}
          </div>

          {/* Activity Timeline */}
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
             <h4 className="text-lg font-bold flex items-center gap-2">
                <Clock className="w-5 h-5 text-zinc-400" /> Activity Stream
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

          {/* Discussions */}
          <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
             <h4 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-zinc-400" /> Discussions
             </h4>
             <div className="space-y-6">
                {issue.comments?.map((comment) => (
                   <div key={comment.id} className="flex gap-4 group">
                      <div className="w-10 h-10 rounded-xl bg-white/10 text-white flex items-center justify-center text-sm font-bold shrink-0">
                         {comment.user?.name?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-2">
                         <div className="flex items-center justify-between border-b border-white/[0.06] pb-1">
                            <span className="text-xs font-semibold text-zinc-400">{comment.user?.name || comment.user?.email}</span>
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

        {/* Right sidebar */}
        <div className="space-y-6">
           <div className="p-8 border border-white/[0.06] bg-white/[0.01] rounded-2xl space-y-6">
              <h4 className="text-lg font-bold flex items-center gap-2">
                 <BarChart2 className="w-5 h-5 text-zinc-400" /> Metrics
              </h4>

              <div className="space-y-4">
                  {[
                    { label: "Node Status", value: issue.status?.replace("_", " "), bg: "bg-blue-500/10 text-blue-400 border border-blue-500/20" },
                    { label: "Cluster Name", value: issue.team?.name || "UNASSIGNED", bg: "bg-white/[0.03] border border-white/[0.06] text-zinc-300" },
                    { label: "Assigned Tech", value: issue.assignedTo?.name || issue.assignedTo?.email || "NOT_ASSIGNED", bg: "bg-white/[0.03] border border-white/[0.06] text-zinc-300" }
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
              {(issue.responseSlaDeadline || issue.resolutionSlaDeadline) && (
                <div className="pt-6 border-t border-white/[0.06] space-y-4">
                   <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                      <Timer className="w-4 h-4 text-zinc-500" /> SLA Monitor
                   </h4>
                   <div className="grid grid-cols-1 gap-3">
                      {issue.responseSlaDeadline && (
                        <div className={cn(
                          "p-4 rounded-xl border",
                          issue.status !== "OPEN" 
                            ? (new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")
                            : "bg-white/[0.02] border-white/[0.06] text-zinc-300"
                        )}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Response Deadline</p>
                          <p className="text-xl font-extrabold tracking-tight">
                            {issue.status !== "OPEN" ? (
                              new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "STABLE" : "BREACHED"
                            ) : (
                              new Date(issue.responseSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.responseSlaDeadline)
                            )}
                          </p>
                        </div>
                      )}
                      {issue.resolutionSlaDeadline && (
                        <div className={cn(
                          "p-4 rounded-xl border",
                          issue.status === "RESOLVED"
                            ? (new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border-red-500/20 text-red-400")
                            : "bg-white/[0.02] border-white/[0.06] text-zinc-300"
                        )}>
                          <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 mb-1">Resolve Deadline</p>
                          <p className="text-xl font-extrabold tracking-tight">
                            {issue.status === "RESOLVED" ? (
                              new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "STABLE" : "BREACHED"
                            ) : (
                              new Date(issue.resolutionSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.resolutionSlaDeadline)
                            )}
                          </p>
                        </div>
                      )}
                   </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/[0.06] space-y-4">
                 <h4 className="text-sm font-bold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-zinc-500" /> Actions
                 </h4>

                 {showAssignmentPanel && (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Team</label>
                        <select
                          value={assignTeamId}
                          onChange={(e) => {
                            setAssignTeamId(e.target.value);
                            setAssignDevId("");
                          }}
                          className="w-full h-11 rounded-xl border border-white/[0.06] bg-[#111113] px-4 text-sm text-white outline-none transition-colors focus:border-white/20"
                        >
                          <option value="" className="bg-[#111113] text-white">
                            Select team...
                          </option>
                          {teamsForProject.map((team) => (
                            <option key={team.id} value={team.id} className="bg-[#111113] text-white">
                              {team.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Assignee</label>
                        <select
                          value={assignDevId}
                          onChange={(e) => setAssignDevId(e.target.value)}
                          className="w-full h-11 rounded-xl border border-white/[0.06] bg-[#111113] px-4 text-sm text-white outline-none transition-colors focus:border-white/20"
                          disabled={!assignTeamId}
                        >
                          <option value="" className="bg-[#111113] text-white">
                            {assignTeamId ? "Unassigned" : "Select team first"}
                          </option>
                          {devsForTeam.map((developer) => (
                            <option key={developer.id} value={developer.id} className="bg-[#111113] text-white">
                              {developer.name || developer.email}
                            </option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => void handleAssign()}
                        disabled={isAssigning || !assignTeamId}
                        className="w-full h-11 rounded-xl bg-white text-black font-semibold text-sm transition-all hover:bg-zinc-200 disabled:opacity-40"
                      >
                        {isAssigning ? "Saving..." : assignDevId ? "Assign issue" : "Update team"}
                      </button>
                    </div>
                 )}

                 {canAdvanceStatus && issue.status === "ASSIGNED" && (
                    <button
                      onClick={() => handleStatusUpdate("IN_PROGRESS")}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      Start Work <ChevronRight className="w-4 h-4" />
                    </button>
                 )}

                 {canAdvanceStatus && issue.status === "IN_PROGRESS" && (
                    <div className="space-y-4">
                       {!isResolving ? (
                        <button
                          onClick={() => setIsResolving(true)}
                          className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                          Resolve Node <CheckCircle className="w-4 h-4" />
                        </button>
                       ) : (
                        <div className="space-y-4 animate-in fade-in duration-200">
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
                              <button 
                                type="submit" 
                                onClick={handleResolveSubmit}
                                disabled={resolvingSubmit || !rootCauseInput.trim()}
                                className="w-full h-11 bg-white text-black hover:bg-zinc-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2"
                              >
                                {resolvingSubmit ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Transmit Restore <ChevronRight className="w-4 h-4" /></>}
                              </button>
                              <button onClick={() => setIsResolving(false)} className="text-xs font-semibold text-zinc-500 hover:text-white underline transition-colors pt-1">Abort</button>
                           </div>
                        </div>
                       )}
                    </div>
                 )}

                 {issue.status === "RESOLVED" && (
                    <div className="bg-white/[0.02] border border-white/[0.06] border-dashed rounded-xl p-6 text-center space-y-2">
                       <CheckCircle className="w-8 h-8 mx-auto text-emerald-400" />
                       <p className="text-sm font-semibold text-white">Node Synchronized</p>
                       <p className="text-[10px] text-zinc-500 uppercase tracking-wider">Incident Archive Locked</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function formatTimeRemaining(deadline: string | Date | null | undefined) {
  if (!deadline) return "";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "BREACHED";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    return `${Math.floor(hours / 24)}D ${hours % 24}H`;
  }
  return `${hours}H ${mins}M`;
}
