"use client";

import { useState, useEffect } from "react";
import { X, Loader2, Send, Clock, MessageSquare, ShieldAlert, Globe, BarChart2, Timer, Github, Sparkles, Lightbulb, Activity, ChevronRight, ExternalLink, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
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
    <div className="fixed inset-0 bg-black/90 z-[150] flex items-center justify-center p-6 sm:p-10 overflow-y-auto custom-scrollbar">
      <div className="bg-white w-full max-w-6xl border-8 border-black shadow-[30px_30px_0_0_black] flex flex-col md:flex-row relative animate-in zoom-in-95 duration-200">
        
        <div className="md:hidden flex justify-between items-center bg-black text-white p-6 border-b-8 border-black">
          <h2 className="text-2xl font-black uppercase italic tracking-tighter">LOG_REPORT</h2>
          <button onClick={onClose} className="p-2 border-2 border-white hover:bg-white hover:text-black transition-colors">
            <X className="w-8 h-8 stroke-[3px]" />
          </button>
        </div>

        <div className="flex-1 p-8 md:p-12 space-y-12 overflow-y-visible md:max-h-[85vh] md:overflow-y-auto custom-scrollbar">
          <div className="space-y-6">
            <div className="flex flex-wrap gap-4 text-[10px] uppercase font-black tracking-widest">
              <span className="bg-[#FFD700] border-2 border-black px-4 py-1 shadow-[4px_4px_0_0_black]">
                ID: {initialIssue.id.slice(-12)}
              </span>
              <span className={cn(
                "px-4 py-1 border-2 border-black shadow-[4px_4px_0_0_black]",
                (issue?.severity || initialIssue.severity) === 'CRITICAL' ? 'bg-[#FF3131] text-white' : 'bg-[#FFD700] text-black'
              )}>
                {issue?.severity || initialIssue.severity}_SEVERITY
              </span>
              {issue?.environment && (
                <span className="bg-[#00D1FF] border-2 border-black px-4 py-1 shadow-[4px_4px_0_0_black]">
                  {issue.environment}_ZONE
                </span>
              )}
               {issue?.priority && (
                <span className="bg-[#FF00FF] text-white border-2 border-black px-4 py-1 shadow-[4px_4px_0_0_black]">
                  {issue.priority}_PRIORITY
                </span>
              )}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-[900] tracking-tighter uppercase italic leading-none border-b-8 border-black pb-8 group">
              {issue?.title || initialIssue.title}
            </h1>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-[#FF3131]" /> INCIDENT_DESCRIPTION
            </h4>
            <div className="text-base font-bold text-black border-4 border-black p-8 bg-[#F8F8F8] shadow-[8px_8px_0_0_black] whitespace-pre-wrap leading-tight italic">
              {issue?.description || initialIssue.description}
            </div>
          </div>

          {issue?.rootCause && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Globe className="w-5 h-5 text-[#32CD32]" /> ROOT_CAUSE_DIAGNOSTICS
              </h4>
              <div className="text-base font-black text-white bg-[#32CD32] border-4 border-black p-8 shadow-[8px_8px_0_0_black] italic">
                &quot;{issue.rootCause}&quot;
              </div>
            </div>
          )}

          {issue?.suggestedFixes && (
            <div className="space-y-4">
              <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-[#FF00FF]" /> AI_REMEDIATION_PROTOCOL
              </h4>
              <div className="text-base font-bold text-white bg-[#FF00FF] border-4 border-black p-8 shadow-[8px_8px_0_0_black] leading-tight">
                <div className="flex gap-6">
                  <Lightbulb className="w-8 h-8 shrink-0 text-[#FFD700] drop-shadow-[2px_2px_0_black]" />
                  <span>{issue.suggestedFixes}</span>
                </div>
              </div>
            </div>
          )}

          <div className="pt-12 border-t-8 border-black space-y-8">
            <h4 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-4">
              <Clock className="w-6 h-6" /> OPERATION_CHRONO
            </h4>
            <div className="space-y-8 ml-4 border-l-8 border-black pl-8 relative">
                {loading ? (
                   <div className="flex items-center gap-4 text-xs font-black uppercase opacity-20 py-8"><Loader2 className="w-6 h-6 animate-spin"/> UPLINK_STABILIZING...</div>
                ) : issue?.activities && issue.activities.length > 0 ? (
                  issue.activities.map((act) => (
                    <div key={act.id} className="relative group">
                      <div className="absolute -left-[44px] top-0 w-6 h-6 bg-white border-4 border-black group-hover:bg-[#FFD700] transition-colors"></div>
                      <div className="space-y-1">
                        <p className="text-lg font-black uppercase italic tracking-tighter leading-none">{act.action}</p>
                        <p className="text-[10px] font-black uppercase text-black/40">{new Date(act.createdAt).toLocaleString()} {"//"} {act.user?.email || "SYSTEM_PROTOCOL"}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs font-black uppercase opacity-20 italic">NULL_ACTIVITY_TELEMETRY</div>
                )}
            </div>
          </div>

          <div className="pt-12 border-t-8 border-black space-y-8">
            <h4 className="text-lg font-black uppercase italic tracking-tighter flex items-center gap-4">
              <MessageSquare className="w-6 h-6" /> COMMS_CHANNEL
            </h4>
            <div className="space-y-8">
              {issue?.comments?.map((comment) => (
                <div key={comment.id} className="flex gap-6 items-start group">
                  <div className="w-16 h-16 bg-black text-[#FFD700] border-4 border-black flex items-center justify-center text-xl font-black rotate-3 group-hover:rotate-0 transition-transform shrink-0 shadow-[4px_4px_0_0_black]">
                    {comment.user?.name?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div className="flex items-center justify-between border-b-2 border-black pb-2">
                      <span className="text-xs font-black uppercase tracking-widest">{comment.user?.name || comment.user?.email}</span>
                      <span suppressHydrationWarning className="text-[10px] font-black uppercase opacity-20">{new Date(comment.createdAt).toLocaleDateString()} {"//"} {new Date(comment.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <div className="text-base font-bold italic leading-tight text-black p-4 bg-white border-2 border-black shadow-[4px_4px_0_0_black]">
                      {comment.text}
                    </div>
                  </div>
                </div>
              ))}
              <form onSubmit={handleAddComment} className="flex flex-col sm:flex-row gap-6 items-end group mt-12 bg-[#F0F0F0] p-8 border-4 border-black shadow-[10px_10px_0_0_black]">
                <textarea 
                  value={commentText}
                  onChange={e => setCommentText(e.target.value)}
                  placeholder="TRANSMIT_UPDATE_OR_QUERY..."
                  className="w-full bg-white border-4 border-black p-6 text-sm font-black uppercase focus:outline-none focus:bg-[#FFD700] transition-colors resize-none min-h-[120px] placeholder:text-black/20"
                />
                <button 
                  disabled={commenting || !commentText.trim()}
                  className="w-full sm:w-auto h-24 px-10 bg-black text-white hover:bg-[#32CD32] hover:text-black transition-all border-4 border-black flex items-center justify-center shadow-[6px_6px_0_0_#FFD700] disabled:opacity-20 active:translate-x-1 active:translate-y-1 active:shadow-none"
                >
                  {commenting ? <Loader2 className="w-8 h-8 animate-spin" /> : <Send className="w-10 h-10 stroke-[3px]" />}
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[400px] bg-[#F0F0F0] border-t-8 md:border-t-0 md:border-l-8 border-black p-8 md:p-12 flex flex-col gap-12 shrink-0 md:max-h-[85vh] md:overflow-y-auto custom-scrollbar">
          <div className="hidden md:flex justify-end">
             <button onClick={onClose} className="p-3 border-4 border-black bg-white hover:bg-black hover:text-white transition-all shadow-[6px_6px_0_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none">
              <X className="w-10 h-10 stroke-[4px]" />
            </button>
          </div>

          <div className="space-y-10">
            <h4 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4 bg-black text-white p-4 -rotate-2">
              <BarChart2 className="w-6 h-6 text-[#FFD700]" /> NODE_METRIC
            </h4>
            
            <div className="space-y-6">
              {[
                { label: "PROTOCOL_STATUS", value: (issue?.status || initialIssue.status)?.replace("_", " "), accent: "bg-[#00D1FF]" },
                { label: "TARGET_UNIT", value: issue?.team?.name || initialIssue.teamName || "NULL_SECTOR", accent: "bg-[#FF00FF]", text: "text-white" },
                { label: "LEAD_OPERATOR", value: issue?.assignedTo?.email || initialIssue.assignedToEmail || "UNALLOCATED", accent: "bg-black", text: "text-white" }
              ].map((row) => (
                <div key={row.label} className="space-y-2 group">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">{row.label}</label>
                  <div className={cn("p-4 border-4 border-black font-black uppercase italic text-sm tracking-tighter shadow-[4px_4px_0_0_black] group-hover:translate-x-1 group-hover:translate-y-1 group-hover:shadow-none transition-all", row.accent, row.text || "text-black")}>
                    {row.value}
                  </div>
                </div>
              ))}
              
              {issue?.source === 'GITHUB' && (
                <div className="pt-4 space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">EXTERNAL_LINK</label>
                  <a 
                    href={(issue.logs as { html_url?: string })?.html_url || "#"} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 border-4 border-black bg-white font-black uppercase text-xs hover:bg-[#FFD700] transition-colors shadow-[4px_4px_0_0_black]"
                  >
                    <span className="flex items-center gap-2"><Github className="w-4 h-4" /> REPOSITORY_NODE</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>

            {(issue?.responseSlaDeadline || issue?.resolutionSlaDeadline) && (
              <div className="pt-10 border-t-4 border-black space-y-8">
                <h4 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                  <Timer className="w-6 h-6 text-[#FF00FF]" /> SLA_MONITOR
                </h4>
                <div className="space-y-6">
                  {issue.responseSlaDeadline && (
                    <div className={cn(
                      "p-6 border-4 border-black shadow-[6px_6px_0_0_black] space-y-3",
                      issue.status !== "OPEN" 
                        ? (new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "bg-[#32CD32]" : "bg-[#FF3131] text-white")
                        : "bg-white"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">RESPONSE_DEADLINE</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-[900] italic leading-none tracking-tighter underline decoration-4">
                          {issue.status !== "OPEN" ? (
                            new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "MET" : "BREACHED"
                          ) : (
                            new Date(issue.responseSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.responseSlaDeadline)
                          )}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] font-black uppercase opacity-40">{new Date(issue.responseSlaDeadline).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}

                  {issue.resolutionSlaDeadline && (
                    <div className={cn(
                      "p-6 border-4 border-black shadow-[6px_6px_0_0_black] space-y-3",
                      issue.status === "RESOLVED"
                        ? (new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "bg-[#32CD32]" : "bg-[#FF3131] text-white")
                        : "bg-white"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-60">RESOLUTION_DEADLINE</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-[900] italic leading-none tracking-tighter underline decoration-4">
                          {issue.status === "RESOLVED" ? (
                            new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "MET" : "BREACHED"
                          ) : (
                            new Date(issue.resolutionSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.resolutionSlaDeadline)
                          )}
                        </span>
                        <span suppressHydrationWarning className="text-[10px] font-black uppercase opacity-40">{new Date(issue.resolutionSlaDeadline).toLocaleTimeString()}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {showAssignForm && (
            <div className="pt-10 border-t-4 border-black space-y-8 animate-in slide-in-from-right-10 duration-500">
               <h4 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4 text-[#FF00FF]">
                 <Activity className="w-6 h-6 shadow-[2px_2px_0_black]" /> UNIT_ALLOCATION
               </h4>
               <form onSubmit={handleAssign} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">UNIT_CLUSTER</label>
                    <select
                      required
                      value={assignTeamId}
                      onChange={(e) => { setAssignTeamId(e.target.value); setAssignDevId(""); }}
                      className="w-full h-14 px-5 bg-white border-4 border-black font-black uppercase italic text-xs focus:bg-[#00D1FF] transition-all cursor-pointer shadow-[4px_4px_0_0_black]"
                    >
                      <option value="">SELECT_CLUSTER...</option>
                      {teams.filter(t => t.projectId === (issue?.projectId || initialIssue.projectId)).map((t) => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                  </div>

                  {assignTeamId && (
                    <div className="space-y-2 animate-in slide-in-from-top-4 duration-300">
                       <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">ASSIGNED_OPERATOR</label>
                       <select
                        value={assignDevId}
                        onChange={(e) => setAssignDevId(e.target.value)}
                        className="w-full h-14 px-5 bg-white border-4 border-black font-black uppercase italic text-xs focus:bg-[#FFD700] transition-all cursor-pointer shadow-[4px_4px_0_0_black]"
                      >
                        <option value="">PENDING_MANUAL_SPEC</option>
                        {developers.filter(d => d.teamId === assignTeamId).map(dev => (
                          <option key={dev.id} value={dev.id}>
                            {dev.name || dev.email}
                            {(issue?.logs as { suggestedAssigneeId?: string })?.suggestedAssigneeId === dev.id ? " [RECOMMENDED]" : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  <button
                    disabled={isAssigning || !assignTeamId}
                    className="w-full h-20 bg-black text-white font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[8px_8px_0_0_#FF00FF] hover:bg-[#FFD700] hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 disabled:opacity-20 flex items-center justify-center gap-4 text-xl"
                  >
                    {isAssigning ? <Loader2 className="w-8 h-8 animate-spin" /> : <>INIT_DEPLOYMENT <ChevronRight className="w-8 h-8 stroke-[4px]" /></>}
                  </button>
               </form>
            </div>
          )}

          {issue?.status === "ASSIGNED" && onStatusChange && !showAssignForm && (
            <button
               onClick={() => onStatusChange(issue.id, "IN_PROGRESS")}
               className="w-full h-20 bg-[#00D1FF] text-black font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-xl flex items-center justify-center gap-4"
            >
              START_REACTION_CMD <ChevronRight className="w-8 h-8 stroke-[4px]" />
            </button>
          )}

          {issue?.status === "IN_PROGRESS" && onStatusChange && (
            <div className="space-y-8">
              {!isResolving ? (
                <button
                   onClick={() => setIsResolving(true)}
                   className="w-full h-20 bg-[#32CD32] text-black font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-xl flex items-center justify-center gap-4"
                >
                  STABILIZE_NODE <CheckCircle className="w-8 h-8 stroke-[4px]" />
                </button>
              ) : (
                <form onSubmit={handleResolveSubmit} className="space-y-8 animate-in zoom-in-95 duration-200">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#32CD32]">ROOT_CAUSE_PROTOCOL_DUMP</label>
                    <textarea 
                      required
                      value={rootCauseInput}
                      onChange={e => setRootCauseInput(e.target.value)}
                      placeholder="ENTER_INCIDENT_FIX_METADATA..."
                      className="w-full bg-white border-4 border-black p-6 text-sm font-black uppercase italic focus:outline-none focus:bg-[#32CD32] transition-colors min-h-[160px] shadow-[6px_6px_0_0_black] placeholder:text-black/20"
                    />
                  </div>
                  <div className="flex flex-col gap-4">
                     <button type="button" onClick={() => setIsResolving(false)} className="w-full py-4 text-xs font-black uppercase underline decoration-2 hover:bg-black hover:text-white transition-all">ABORT_STABILIZATION</button>
                     <button 
                      type="submit" 
                      disabled={resolvingSubmit || !rootCauseInput.trim()}
                      className="w-full h-20 bg-black text-white font-[900] uppercase italic tracking-widest border-4 border-black shadow-[8px_8px_0_0_#32CD32] hover:bg-[#32CD32] hover:text-black transition-all flex items-center justify-center gap-4 disabled:opacity-20"
                     >
                        {resolvingSubmit ? <Loader2 className="w-8 h-8 animate-spin" /> : <>TRANSMIT_RESTORE_CMD <ChevronRight className="w-8 h-8 stroke-[4px]" /></>}
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
  if (diff <= 0) return "EXPIRED";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 24) {
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  }
  return `${hours}h ${mins}m`;
}
