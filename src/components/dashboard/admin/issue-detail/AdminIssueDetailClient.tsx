"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, Send, Clock, MessageSquare, ShieldAlert, Globe, 
  BarChart2, Timer, Sparkles, Lightbulb, 
  Activity, ChevronRight, CheckCircle, ArrowLeft, 
  Terminal, Zap, Shield,Users, Layout 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useCallback } from "react";

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
}

export default function AdminIssueDetailClient({ issueId, allTeams, allDevelopers }: AdminIssueDetailClientProps) {
  const router = useRouter();
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
        fetchIssueDetail();
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
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
        fetchIssueDetail();
      } else {
        const data = await res.json();
        alert(data.error || "Failed to re-allocate resources");
      }
    } catch (err) {
      console.error("Assignment error:", err);
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
        fetchIssueDetail();
      }
    } catch (err) {
      console.error("Status update error:", err);
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8">
        <Loader2 className="w-20 h-20 animate-spin text-black" />
        <p className="text-2xl font-black uppercase italic tracking-widest animate-pulse">SYNCHRONIZING_OPERATION_LOGS...</p>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div className="p-12 border-8 border-black bg-[#FF3131] text-white flex flex-col items-center justify-center space-y-8 animate-shake">
        <ShieldAlert className="w-24 h-24 stroke-[3px]" />
        <h1 className="text-5xl font-black uppercase italic tracking-tighter">DATA_LOSS_DETECTED</h1>
        <p className="text-xl font-bold uppercase">{error || "PROTOCOL_NULL_TARGET"}</p>
        <button onClick={() => router.back()} className="px-10 py-4 border-4 border-white font-black uppercase hover:bg-white hover:text-[#FF3131] transition-all flex items-center gap-4 shadow-[8px_8px_0_0_black]">
          <ArrowLeft className="w-8 h-8" /> RETURN_TO_DASHBOARD
        </button>
      </div>
    );
  }

  const teamsForProject = allTeams.filter(t => t.projectId === issue.projectId);
  const devsForTeam = allDevelopers.filter(d => d.teamId === assignTeamId);

  return (
    <div className="space-y-12 pb-24 max-w-[1400px] mx-auto">
      
      {/* ── TOP NAVIGATION BAR ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b-4 border-black pb-8">
        <div className="flex items-center gap-6 group">
          <button 
            onClick={() => router.back()} 
            className="w-14 h-14 border-4 border-black flex items-center justify-center hover:bg-black hover:text-white transition-all shadow-[6px_6px_0_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none bg-white shrink-0"
          >
            <ArrowLeft className="w-8 h-8 stroke-[3px]" />
          </button>
          <div className="space-y-1">
             <div className="flex items-center gap-3">
                <span className="bg-[#FFD700] text-black px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.3em] border-2 border-black">SYSTEM_DEKAI_ACTIVE</span>
                <span className="text-black/30 font-black text-[10px] font-mono">DUMP_HASH_{issue.id.slice(-6).toUpperCase()}</span>
             </div>
             <h1 className="text-4xl md:text-6xl font-[950] tracking-tighter uppercase italic leading-[0.8] text-black drop-shadow-[4px_4px_0_rgba(0,0,0,0.05)]">
               {issue.title}
             </h1>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-4 items-center">
          {[
            { label: "STATUS", value: issue.status.replace("_", " "), color: issue.status === "RESOLVED" ? "bg-[#32CD32]" : issue.status === "IN_PROGRESS" ? "bg-[#00D1FF]" : "bg-black text-white" },
            { label: "SEVERITY", value: issue.severity, color: issue.severity === "CRITICAL" ? "bg-[#FF3131] text-white" : "bg-[#FFD700] text-black" }
          ].map((badge) => (
            <div key={badge.label} className={cn(
              "h-14 px-6 flex flex-col justify-center border-4 border-black font-black uppercase italic shadow-[4px_4px_0_0_black]",
              badge.color
            )}>
              <span className="text-[10px] opacity-40 leading-none mb-0.5">{badge.label}</span>
              <span className="text-lg tracking-tighter">{badge.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
        
        {/* ── LEFT CONTENT COLUMN ── */}
        <div className="lg:col-span-8 space-y-16">
          
          {/* DESCRIPTION BLOCK */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 bg-black text-white px-6 py-2 inline-flex -rotate-1 shadow-[6px_6px_0_0_#FF3131] border-2 border-black">
               <ShieldAlert className="w-6 h-6 text-[#FF3131]" />
               <h3 className="text-lg font-black uppercase italic tracking-tighter">INCIDENT_SYSTEM_REPORT</h3>
            </div>
            <div className="bg-white border-4 border-black p-0 shadow-[12px_12px_0_0_black] relative group overflow-hidden">
               {/* Internal Header */}
               <div className="bg-[#F8F8F8] border-b-4 border-black p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-2 h-2 bg-black rounded-full animate-pulse"></div>
                     <span className="text-[10px] font-black uppercase tracking-widest opacity-40">RAW_INPUT_STREAM</span>
                  </div>
                  <div className="flex gap-2">
                     <div className="w-12 h-1 bg-black/10"></div>
                     <div className="w-8 h-1 bg-black/10"></div>
                  </div>
               </div>
               
               <div className="p-10 relative">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-[#FFD700] border-l-4 border-b-4 border-black opacity-10"></div>
                  <div className="text-2xl font-[800] leading-[1.2] italic text-black whitespace-pre-wrap relative z-10 tracking-tight">
                    {issue.description}
                  </div>
               </div>

               {/* Footer Tag */}
               <div className="bg-black text-[9px] font-black text-white/40 px-4 py-1 flex items-center justify-between">
                  <span>SOURCE_NODE: {issue.source || "LOCAL_UPLINK"}</span>
                  <span className="italic">ENCRYPTED_TRANSMISSION_STABLE</span>
               </div>
            </div>
          </section>

          {/* AI REMEDIATION SECTION */}
          {issue.suggestedFixes && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 bg-[#FF00FF] text-white px-6 py-2 border-4 border-black shadow-[6px_6px_0_0_black]">
                 <Sparkles className="w-6 h-6 text-[#FFD700] animate-pulse" />
                 <h3 className="text-lg font-black uppercase italic tracking-tighter">AI_PREDICTIVE_RECOVERY_PROTOCOL</h3>
              </div>
              <div className="bg-[#0A0A0A] text-white border-4 border-black p-8 shadow-[12px_12px_0_0_#FF00FF] relative overflow-hidden group">
                 {/* Scanning Animation Line */}
                 <div className="absolute inset-x-0 top-0 h-[2px] bg-[#FF00FF] shadow-[0_0_15px_#FF00FF] animate-scan-slow opacity-50"></div>
                 
                 <div className="flex flex-col xl:flex-row gap-10 relative z-10">
                    <div className="bg-[#FF00FF]/10 p-6 border-4 border-[#FF00FF]/30 h-auto self-start shadow-[6px_6px_0_0_#FF00FF]">
                       <Lightbulb className="w-14 h-14 text-[#FFD700] animate-pulse" />
                    </div>
                    <div className="space-y-8 flex-1">
                       <div className="pb-8 border-b-2 border-white/10">
                          <div className="flex items-center gap-4 mb-3">
                             <div className="w-2 h-2 bg-[#FF00FF] animate-ping"></div>
                             <p className="text-[10px] font-black text-[#FF00FF] uppercase tracking-[0.4em]">STABILIZATION_STRATEGY_FOUND</p>
                          </div>
                          <p className="text-xl font-black leading-tight italic text-white/90">
                            {issue.suggestedFixes}
                          </p>
                       </div>
                       <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
                          <div className="p-4 border-2 border-[#00D1FF]/30 bg-[#00D1FF]/5">
                             <p className="text-[9px] font-black uppercase tracking-widest text-[#00D1FF] mb-1 opacity-60">CONFIDENCE</p>
                             <p className="text-2xl font-black text-white italic">94.2<span className="text-xs opacity-30">%</span></p>
                          </div>
                          <div className="p-4 border-2 border-[#32CD32]/30 bg-[#32CD32]/5">
                             <p className="text-[9px] font-black uppercase tracking-widest text-[#32CD32] mb-1 opacity-60">RECOVERY_EST</p>
                             <p className="text-2xl font-black text-white italic">-45<span className="text-xs opacity-30">MIN</span></p>
                          </div>
                          <div className="p-4 border-2 border-white/10 bg-white/5 md:col-span-2">
                             <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">DATA_VECTORS</p>
                             <div className="flex gap-2">
                                {[1,2,3,4,5].map(i => (
                                  <div key={i} className="flex-1 h-3 bg-white/10 border border-white/10">
                                    <div className="h-full bg-[#FF00FF]/40" style={{ width: `${Math.random() * 100}%` }}></div>
                                  </div>
                                ))}
                             </div>
                          </div>
                       </div>
                    </div>
                 </div>
              </div>
            </section>
          )}

          {/* ROOT CAUSE DIAGNOSTICS (IF RESOLVED) */}
          {issue.rootCause && (
            <section className="space-y-6">
              <div className="flex items-center gap-4 bg-[#32CD32] text-black px-6 py-3 inline-flex -rotate-2 border-4 border-black">
                 <Globe className="w-6 h-6" />
                 <h3 className="text-xl font-black uppercase italic tracking-tighter">ROOT_CAUSE_PROTOCOL_DUMP</h3>
              </div>
              <div className="bg-[#32CD32] border-8 border-black p-12 shadow-[20px_20px_0_0_black]">
                 <div className="text-2xl font-black text-black italic leading-none tracking-tighter italic">
                   &quot;{issue.rootCause}&quot;
                 </div>
              </div>
            </section>
          )}

          {/* OPERATION TIMELINE (ACTIVITY) */}
          <section className="space-y-8 pt-12 border-t-8 border-black/5">
             <div className="flex items-center justify-between">
                <h3 className="text-4xl font-[900] uppercase italic tracking-tighter flex items-center gap-6">
                   <Clock className="w-10 h-10 text-[#00D1FF]" /> OPERATION_TIMELINE
                </h3>
                <span className="text-xs bg-black text-white px-4 py-1 font-black">ENTRIES: {issue.activities?.length || 0}</span>
             </div>
             
             <div className="space-y-12 ml-6 border-l-8 border-black pl-12 relative py-10">
                {issue.activities?.map((act) => (
                  <div key={act.id} className="relative group">
                    <div className="absolute -left-[64px] top-4 w-10 h-10 bg-white border-8 border-black group-hover:bg-black group-hover:border-white transition-all duration-300"></div>
                    <div className="bg-white border-4 border-black p-8 shadow-[10px_10px_0_0_black] hover:translate-x-2 transition-transform">
                       <p className="text-2xl font-black uppercase italic tracking-tighter mb-4 text-[#00D1FF] group-hover:text-black transition-colors">{act.action}</p>
                       <div className="flex justify-between items-end">
                          <p className="text-base font-bold italic opacity-60 w-full max-w-xl leading-tight">
                             Protocol modification executed successfully by remote operator. All dependencies maintained.
                          </p>
                          <div className="text-right shrink-0">
                             <p className="text-[10px] font-black uppercase tracking-widest text-black/40">{act.user?.email || "SYSTEM_DAEMON"}</p>
                             <p className="text-sm font-black text-black">{new Date(act.createdAt).toLocaleString()}</p>
                          </div>
                       </div>
                    </div>
                  </div>
                ))}
                {!issue.activities?.length && (
                  <p className="text-xl font-black uppercase italic opacity-20 py-10">NULL_CHRONO_DATA_SYNC_WAITING...</p>
                )}
             </div>
          </section>

          {/* COMMS CHANNEL (COMMENTS) */}
          <section className="space-y-10 pt-20 border-t-8 border-black">
             <div className="flex items-center justify-between">
                <h3 className="text-4xl font-[900] uppercase italic tracking-tighter flex items-center gap-6">
                   <MessageSquare className="w-10 h-10 text-[#FFD700]" /> COMMS_CHANNEL
                </h3>
             </div>

             <div className="space-y-12">
                {issue.comments?.map((comment) => (
                  <div key={comment.id} className="flex gap-10 items-start group">
                    <div className="w-24 h-24 bg-black text-[#FFD700] border-[6px] border-black flex items-center justify-center text-5xl font-black rotate-6 group-hover:rotate-0 transition-transform shrink-0 shadow-[8px_8px_0_0_black]">
                      {comment.user?.name?.[0] || comment.user?.email?.[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 space-y-6">
                      <div className="flex items-center justify-between border-b-4 border-black pb-4">
                        <span className="text-xl font-black uppercase italic tracking-tighter text-black/40">{comment.user?.name || comment.user?.email}</span>
                        <span suppressHydrationWarning className="text-sm font-black bg-[#F8F8F8] px-4 py-1 border-2 border-black italic">
                          {new Date(comment.createdAt).toLocaleDateString()} @ {new Date(comment.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-2xl font-bold leading-tight italic text-black p-10 bg-white border-4 border-black shadow-[12px_12px_0_0_black] relative">
                         <div className="absolute top-0 right-0 w-8 h-8 bg-black"></div>
                         &quot;{comment.text}&quot;
                      </div>
                    </div>
                  </div>
                ))}

                <form onSubmit={handleAddComment} className="mt-16 bg-[#F0F0F0] border-8 border-black p-1 shadow-[20px_20px_0_0_#FFD700]">
                   <div className="bg-white p-12 space-y-8">
                      <div className="flex items-center gap-4 text-[#FFD700] bg-black px-6 py-2 inline-flex mb-4">
                        <Terminal className="w-6 h-6" />
                        <span className="text-xs font-black uppercase tracking-[0.3em]">INIT_BROADCAST</span>
                      </div>
                      <textarea 
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        placeholder="ENTER_UPDATE_OR_STATUS_REPORT..."
                        className="w-full bg-white border-8 border-black p-10 text-2xl font-black uppercase italic focus:outline-none focus:bg-[#FFD700] transition-colors resize-none min-h-[220px] placeholder:text-black/10 outline-none"
                      />
                      <div className="flex justify-end">
                        <button 
                          disabled={commenting || !commentText.trim()}
                          className="w-full md:w-96 h-28 bg-black text-white hover:bg-[#FFD700] hover:text-black transition-all border-4 border-black flex items-center justify-center shadow-[15px_15px_0_0_black] hover:shadow-none hover:translate-x-2 hover:translate-y-2 disabled:opacity-20 active:scale-95 group"
                        >
                          {commenting ? (
                            <Loader2 className="w-12 h-12 animate-spin" />
                          ) : (
                            <div className="flex items-center gap-6">
                               <span className="text-4xl font-[900] uppercase italic tracking-tighter">TRANSMIT</span>
                               <Send className="w-12 h-12 stroke-[4px] group-hover:rotate-45 transition-transform" />
                            </div>
                          )}
                        </button>
                      </div>
                   </div>
                </form>
             </div>
          </section>
        </div>

        {/* ── RIGHT SIDEBAR: METRICS & ACTIONS ── */}
        <aside className="lg:col-span-4 space-y-16 lg:sticky lg:top-12">
          
          {/* META DATA BOARD */}
          <div className="p-8 border-4 border-black bg-white shadow-[10px_10px_0_0_black] space-y-10">
            <h4 className="text-2xl font-[900] uppercase italic tracking-tighter flex items-center gap-4 bg-black text-[#FFD700] p-4 -rotate-1">
              <BarChart2 className="w-8 h-8" /> SYSTEM_NODES
            </h4>
            
            <div className="space-y-6">
              {[
                { label: "PRIMARY_TARGET", value: issue.team?.name || "NULL_SECTOR", accent: "bg-[#00D1FF]", icon: Layout },
                { label: "UNIT_CLUSTER", value: issue.team?.name || "UNALLOCATED", accent: "bg-[#FF00FF]", icon: Users, invert: true },
                { label: "LEAD_OPERATOR", value: issue.assignedTo?.name || issue.assignedTo?.email || "NOT_ASSIGNED", accent: "bg-[#32CD32]", icon: Activity }
              ].map((row) => (
                <div key={row.label} className="space-y-1 group">
                  <div className="flex items-center justify-between px-1">
                    <label className="text-[10px] font-black uppercase tracking-widest text-black/40">{row.label}</label>
                  </div>
                  <div className={cn(
                    "p-5 border-4 border-black font-black uppercase italic text-xl tracking-tighter shadow-[4px_4px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all",
                    row.accent, row.invert ? "text-white" : "text-black"
                  )}>
                    {row.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SLA MONITORING BOARD */}
          {(issue.responseSlaDeadline || issue.resolutionSlaDeadline) && (
            <div className="p-6 md:p-8 border-4 border-black bg-white shadow-[10px_10px_0_0_#FF00FF] space-y-8">
               <h4 className="text-xl font-[900] uppercase italic tracking-tighter flex items-center gap-4 text-[#FF00FF]">
                 <Timer className="w-8 h-8 border-2 border-[#FF00FF] p-1" /> SLA_MONITOR
               </h4>
               
               <div className="space-y-6">
                  {issue.responseSlaDeadline && (
                    <div className={cn(
                      "p-5 border-2 border-black shadow-[4px_4px_0_0_black] space-y-2 transition-colors",
                      issue.status !== "OPEN" 
                        ? (new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "bg-[#32CD32]" : "bg-[#FF3131] text-white")
                        : "bg-[#F8F8F8]"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">RESPONSE_DEADLINE</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-[900] italic leading-none tracking-tighter">
                          {issue.status !== "OPEN" ? (
                            new Date(issue.responseSlaDeadline) > new Date(issue.acceptedAt || Date.now()) ? "STABLE" : "BREACHED"
                          ) : (
                            new Date(issue.responseSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.responseSlaDeadline)
                          )}
                        </span>
                      </div>
                    </div>
                  )}

                  {issue.resolutionSlaDeadline && (
                    <div className={cn(
                      "p-5 border-2 border-black shadow-[4px_4px_0_0_black] space-y-2 transition-colors",
                      issue.status === "RESOLVED"
                        ? (new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "bg-[#32CD32]" : "bg-[#FF3131] text-white")
                        : "bg-[#F8F8F8]"
                    )}>
                      <p className="text-[10px] font-black uppercase tracking-widest opacity-40">RESOLUTION_DEADLINE</p>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-[900] italic leading-none tracking-tighter">
                          {issue.status === "RESOLVED" ? (
                            new Date(issue.resolutionSlaDeadline) > new Date(issue.resolvedAt || Date.now()) ? "STABLE" : "BREACHED"
                          ) : (
                            new Date(issue.resolutionSlaDeadline) < new Date() ? "BREACHED" : formatTimeRemaining(issue.resolutionSlaDeadline)
                          )}
                        </span>
                      </div>
                    </div>
                  )}
               </div>
            </div>
          )}

          {/* ACTION DEPLOYMENT RIG */}
          <div className="p-6 md:p-8 border-4 border-black bg-[#FFD700] shadow-[10px_10px_0_0_black] space-y-8 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-24 h-full bg-black/5 -skew-x-12 translate-x-12"></div>
             <h4 className="text-xl font-[900] uppercase italic tracking-tighter flex items-center gap-4 text-black relative z-10">
                <Zap className="w-8 h-8 fill-black" /> DEPLOY_ACTION
             </h4>

             <div className="space-y-8 relative z-10">
                {/* Assignment Form */}
                {issue.status === "OPEN" && (
                   <div className="space-y-6">
                      <div className="space-y-3">
                         <label className="text-[10px] font-black uppercase underline tracking-widest text-black/60">TARGET_CLUSTER</label>
                         <div className="relative">
                           <select
                            required
                            value={assignTeamId}
                            onChange={(e) => { setAssignTeamId(e.target.value); setAssignDevId(""); }}
                            className="w-full h-12 px-4 bg-white border-4 border-black font-black uppercase italic text-xs focus:bg-white transition-all cursor-pointer shadow-[4px_4px_0_0_black] outline-none appearance-none"
                          >
                            <option value="">SELECT_NODE...</option>
                            {teamsForProject.map((t) => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                          <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 stroke-[3px] pointer-events-none" />
                         </div>
                      </div>

                      <AnimatePresence>
                      {assignTeamId && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-3"
                        >
                           <label className="text-[10px] font-black uppercase underline tracking-widest text-black/60">LEAD_OPERATOR</label>
                           <div className="relative">
                            <select
                              value={assignDevId}
                              onChange={(e) => setAssignDevId(e.target.value)}
                              className="w-full h-12 px-4 bg-white border-4 border-black font-black uppercase italic text-xs transition-all cursor-pointer shadow-[4px_4px_0_0_black] outline-none appearance-none"
                            >
                              <option value="">MANUAL_PENDING</option>
                              {devsForTeam.map(dev => (
                                <option key={dev.id} value={dev.id}>
                                  {dev.name || dev.email}
                                </option>
                              ))}
                            </select>
                            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 rotate-90 stroke-[3px] pointer-events-none" />
                           </div>
                        </motion.div>
                      )}
                      </AnimatePresence>

                      <button
                        onClick={handleAssign}
                        disabled={isAssigning || !assignTeamId}
                        className="w-full h-16 bg-black text-[#FFD700] font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[6px_6px_0_0_black] hover:bg-black hover:text-white hover:translate-x-1 hover:translate-y-1 hover:shadow-none disabled:opacity-20 flex items-center justify-center gap-4 text-xl group"
                      >
                        {isAssigning ? <Loader2 className="w-6 h-6 animate-spin" /> : <>EXECUTE_DEPLOY <Zap className="w-6 h-6" /></>}
                      </button>
                   </div>
                )}

                {/* Progress Transitions */}
                {issue.status === "ASSIGNED" && (
                   <button
                     onClick={() => handleStatusUpdate("IN_PROGRESS")}
                     className="w-full h-20 bg-black text-[#00D1FF] font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-[#00D1FF] hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-2xl flex items-center justify-center gap-6 group"
                   >
                     START_REACTOR <Shield className="w-10 h-10 group-hover:rotate-12 transition-transform" />
                   </button>
                )}

                {/* Resolution Rig */}
                {issue.status === "IN_PROGRESS" && (
                   <div className="space-y-6">
                      {!isResolving ? (
                        <button
                          onClick={() => setIsResolving(true)}
                          className="w-full h-20 bg-black text-[#32CD32] font-[900] uppercase italic tracking-widest transition-all border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-[#32CD32] hover:text-black hover:shadow-none hover:translate-x-1 hover:translate-y-1 text-2xl flex items-center justify-center gap-6 group"
                        >
                          INIT_STABILIZE <CheckCircle className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </button>
                      ) : (
                        <div className="space-y-6 animate-in zoom-in-95 duration-300">
                           <div className="space-y-3">
                              <label className="text-[10px] font-black uppercase text-black italic leading-none">ROOT_CAUSE_DIAGNOSTIC</label>
                              <textarea 
                                required
                                value={rootCauseInput}
                                onChange={e => setRootCauseInput(e.target.value)}
                                placeholder="ENTER_FIX_METADATA..."
                                className="w-full bg-white border-4 border-black p-4 text-sm font-black uppercase italic focus:outline-none focus:bg-white transition-colors min-h-[120px] shadow-[6px_6px_0_0_black] placeholder:text-black/10 outline-none"
                              />
                           </div>
                           <div className="flex flex-col gap-4">
                              <button 
                                type="submit" 
                                onClick={handleResolveSubmit}
                                disabled={resolvingSubmit || !rootCauseInput.trim()}
                                className="w-full h-16 bg-black text-[#32CD32] font-[900] uppercase italic tracking-widest border-4 border-black shadow-[6px_6px_0_0_black] hover:bg-[#32CD32] hover:text-black hover:shadow-none transition-all flex items-center justify-center gap-6 text-xl disabled:opacity-20"
                              >
                                {resolvingSubmit ? <Loader2 className="w-6 h-6 animate-spin" /> : <>TRANSMIT_RESTORE <CheckCircle className="w-8 h-8" /></>}
                              </button>
                              <button onClick={() => setIsResolving(false)} className="text-[10px] font-black uppercase underline hover:opacity-60 transition-opacity">ABORT_STABILIZATION</button>
                           </div>
                        </div>
                      )}
                   </div>
                )}

                {issue.status === "RESOLVED" && (
                   <div className="bg-black/5 border-4 border-black border-dashed p-10 text-center space-y-4">
                      <CheckCircle className="w-16 h-16 mx-auto text-[#32CD32] animate-bounce" />
                      <p className="text-xl font-black uppercase italic tracking-tighter">NODE_SYNCHRONIZED</p>
                      <p className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em]">INCIDENT_ARCHIVE_LOCKED</p>
                   </div>
                )}
             </div>
          </div>
        </aside>

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
