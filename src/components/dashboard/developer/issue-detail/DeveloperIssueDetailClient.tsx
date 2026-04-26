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
        const resDetail = await fetch(`/api/issues/${issue.id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const dataDetail = await resDetail.json();
        if (resDetail.ok) setIssue(dataDetail.issue);
      }
    } catch (err) {
      console.error("Failed to add comment:", err);
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
      if (!res.ok) throw new Error("Failed to update status");
      
      // Refresh local data
      const resDetail = await fetch(`/api/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const dataDetail = await resDetail.json();
      if (resDetail.ok) setIssue(dataDetail.issue);
      
      router.refresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Update failed");
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
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── TOP NAV / BREADCRUMB ── */}
      <button 
        onClick={() => router.back()}
        className="flex items-center gap-2 group text-black font-black uppercase text-xs tracking-widest hover:translate-x-[-4px] transition-all"
      >
        <ArrowLeft className="w-5 h-5 border-2 border-black bg-[#FFD700] p-0.5 group-hover:bg-black group-hover:text-white transition-colors" />
        RETURN_TO_WORKSPACE
      </button>

      <div className="bg-white border-8 border-black shadow-[20px_20px_0_0_black] flex flex-col xl:flex-row relative">
        {/* Decorative elements */}
        <div className="absolute -top-4 -left-4 w-12 h-12 bg-[#FFD700] border-4 border-black -rotate-6 z-20"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#00D1FF] border-l-4 border-b-4 border-black -mr-16 -mt-16 rotate-45 pointer-events-none opacity-20"></div>

        <div className="flex-1 p-8 md:p-16 space-y-16 border-b-8 xl:border-b-0 xl:border-r-8 border-black overflow-hidden">
          {/* Header Info */}
          <div className="space-y-8">
            <div className="flex flex-wrap gap-4 text-[10px] uppercase font-black tracking-[0.2em]">
               <span className="bg-black text-white px-4 py-1.5">UNIT_ID: {issue.id.slice(-12)}</span>
               <span className={cn(
                  "px-4 py-1.5 border-2 border-black",
                  issue.severity === 'CRITICAL' ? 'bg-[#FF3131] text-white' : 'bg-[#FFD700] text-black'
               )}>{issue.severity}_LEVEL</span>
               <span className="bg-[#00D1FF] border-2 border-black px-4 py-1.5">{issue.status?.replace("_", " ")}</span>
            </div>
            
            <h1 className="text-5xl md:text-8xl font-[1000] tracking-tighter uppercase italic leading-[0.85] text-black">
              {issue.title}
            </h1>
          </div>

          {/* Description */}
          <div className="space-y-6">
            <h4 className="text-xs font-black uppercase tracking-[0.4em] flex items-center gap-4 text-black/40">
              <ShieldAlert className="w-5 h-5 text-[#FF3131]" /> DESCRIPTION_LOG.EXE
            </h4>
            <div className="text-xl font-bold text-black border-4 border-black p-10 bg-[#F8F8F8] shadow-[12px_12px_0_0_black] whitespace-pre-wrap leading-tight italic">
              {issue.description}
            </div>
          </div>

          {/* Root Cause & AI Remediations */}
          {(issue.rootCause || issue.suggestedFixes) && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
               {issue.rootCause && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">ROOT_CAUSE_PROTOCOL</h4>
                  <div className="bg-[#32CD32] border-4 border-black p-6 font-black italic shadow-[8px_8px_0_0_black]">
                    &quot;{issue.rootCause}&quot;
                  </div>
                </div>
               )}
               {issue.suggestedFixes && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/40">AI_GEN_ADVISORY</h4>
                  <div className="bg-[#FF00FF] text-white border-4 border-black p-6 font-bold shadow-[8px_8px_0_0_black] flex gap-4">
                     <Lightbulb className="w-8 h-8 shrink-0 text-[#FFD700]" />
                     <span>{issue.suggestedFixes}</span>
                  </div>
                </div>
               )}
            </div>
          )}

          {/* Activity Timeline */}
          <div className="space-y-10 pt-8 border-t-8 border-black">
             <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <Clock className="w-8 h-8" /> CHRONO_STREAM
             </h4>
             <div className="space-y-10 ml-5 border-l-8 border-black pl-10 relative">
                {issue.activities?.map((act) => (
                  <div key={act.id} className="relative">
                     <div className="absolute -left-[54px] top-1 w-8 h-8 bg-white border-4 border-black flex items-center justify-center font-black text-[10px]">
                        {act.action[0]}
                     </div>
                     <div className="space-y-1">
                        <p className="text-2xl font-black uppercase italic tracking-tighter leading-none">{act.action}</p>
                        <p className="text-[10px] font-black uppercase opacity-40">{new Date(act.createdAt).toLocaleString()} {"//"} {act.user?.email || "SYSTEM"}</p>
                     </div>
                  </div>
                ))}
             </div>
          </div>

          {/* Comments Section */}
          <div className="space-y-10 pt-8 border-t-8 border-black">
             <h4 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                <MessageSquare className="w-8 h-8" /> COMMS_FLOW
             </h4>
             <div className="space-y-12">
                {issue.comments?.map((comment) => (
                   <div key={comment.id} className="flex gap-8 group">
                      <div className="w-16 h-16 bg-black text-[#FFD700] border-4 border-black flex items-center justify-center text-2xl font-black shrink-0 shadow-[6px_6px_0_0_black] -rotate-3 group-hover:rotate-0 transition-transform">
                         {comment.user?.email?.[0]?.toUpperCase()}
                      </div>
                      <div className="flex-1 space-y-4">
                         <div className="flex items-center justify-between border-b-2 border-black pb-2 opacity-40">
                            <span className="text-[10px] font-black uppercase tracking-widest">{comment.user?.email}</span>
                            <span className="text-[10px] font-black uppercase">{new Date(comment.createdAt).toDateString()}</span>
                         </div>
                         <div className="text-lg font-bold italic p-6 bg-white border-4 border-black shadow-[6px_6px_0_0_black]">
                            {comment.text}
                         </div>
                      </div>
                   </div>
                ))}

                <form onSubmit={handleAddComment} className="mt-12 group bg-[#F0F0F0] p-10 border-4 border-black shadow-[12px_12px_0_0_black]">
                   <textarea 
                    value={commentText}
                    onChange={e => setCommentText(e.target.value)}
                    placeholder="TRANSMIT_SIGNAL..."
                    className="w-full h-32 bg-white border-4 border-black p-6 font-black uppercase focus:bg-[#FFD700] transition-colors resize-none placeholder:opacity-20 outline-none"
                   />
                   <div className="flex justify-end mt-6">
                      <button 
                         disabled={commenting || !commentText.trim()}
                         className="h-16 px-12 bg-black text-white font-black italic uppercase border-4 border-black shadow-[8px_8px_0_0_#32CD32] hover:shadow-none hover:translate-x-1 hover:translate-y-1 active:scale-95 transition-all flex items-center gap-4 disabled:opacity-20"
                      >
                         {commenting ? <Loader2 className="w-6 h-6 animate-spin" /> : <>TRANSMIT <Send className="w-6 h-6 stroke-[3px]" /></>}
                      </button>
                   </div>
                </form>
             </div>
          </div>
        </div>

        {/* Sidebar Info & Controls */}
        <div className="w-full xl:w-[450px] bg-[#F0F0F0] p-8 md:p-12 space-y-12 shrink-0">
           <div className="space-y-10 sticky top-12">
              <h4 className="text-xl font-black uppercase flex items-center gap-4 bg-black text-white p-4 -rotate-1 shrink-0">
                 <BarChart2 className="w-6 h-6 text-[#FFD700]" /> SYS_METRICS
              </h4>

              <div className="space-y-6">
                  {[
                    { label: "NODE_STATUS", value: issue.status?.replace("_", " "), bg: "bg-[#00D1FF]" },
                    { label: "CLUSTER_NAME", value: issue.teamName || "UNASSIGNED", bg: "bg-white" },
                    { label: "ASSIGNED_TECH", value: issue.assignedToEmail || "PENDING", bg: "bg-black", text: "text-white" }
                  ].map((row) => (
                    <div key={row.label} className="space-y-2 group">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/40 ml-1">{row.label}</label>
                      <div className={cn("p-4 border-4 border-black font-[1000] uppercase italic shadow-[4px_4px_0_0_black] group-hover:shadow-none group-hover:translate-x-1 group-hover:translate-y-1 transition-all", row.bg, row.text)}>
                        {row.value}
                      </div>
                    </div>
                  ))}
              </div>

              {/* SLA Section */}
              <div className="pt-10 border-t-4 border-black space-y-8">
                 <h4 className="text-xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                    <Timer className="w-6 h-6 text-[#FF00FF]" /> SLA_MONITOR
                 </h4>
                 <div className="grid gap-6">
                    {issue.responseSlaDeadline && (
                      <div className={cn(
                        "p-6 border-4 border-black shadow-[6px_6px_0_0_black]",
                        issue.status !== "OPEN" ? "bg-[#32CD32]" : "bg-white"
                      )}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">RESP_DEADLINE</p>
                        <p className="text-3xl font-[1000] italic tracking-tighter leading-none">
                          {issue.status !== "OPEN" ? "STABLE" : formatTimeRemaining(issue.responseSlaDeadline)}
                        </p>
                      </div>
                    )}
                    {issue.resolutionSlaDeadline && (
                      <div className={cn(
                        "p-6 border-4 border-black shadow-[6px_6px_0_0_black]",
                        issue.status === "RESOLVED" ? "bg-[#32CD32]" : "bg-white"
                      )}>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2">RESOLVE_DEADLINE</p>
                        <p className="text-3xl font-[1000] italic tracking-tighter leading-none">
                          {issue.status === "RESOLVED" ? "STABLE" : formatTimeRemaining(issue.resolutionSlaDeadline)}
                        </p>
                      </div>
                    )}
                 </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-10 space-y-6">
                 {issue.status === "ASSIGNED" && (
                  <button 
                    onClick={() => handleStatusChange(issue.id, "IN_PROGRESS")}
                    className="w-full h-20 bg-[#00D1FF] border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-black hover:text-white transition-all font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-4"
                  >
                    START_WORK <ChevronRight className="w-8 h-8 stroke-[4px]" />
                  </button>
                 )}

                 {issue.status === "IN_PROGRESS" && (
                    <div className="space-y-6">
                       {!isResolving ? (
                        <button 
                          onClick={() => setIsResolving(true)}
                          className="w-full h-20 bg-[#32CD32] border-4 border-black shadow-[8px_8px_0_0_black] hover:bg-black hover:text-white transition-all font-black text-xl uppercase italic tracking-tighter flex items-center justify-center gap-4"
                        >
                          RESOLVE_NODE <CheckCircle className="w-8 h-8 stroke-[4px]" />
                        </button>
                       ) : (
                        <form onSubmit={handleResolveSubmit} className="space-y-6 animate-in zoom-in-95 duration-200">
                           <div className="space-y-2">
                              <label className="text-[10px] font-black uppercase text-[#32CD32]">ROOT_CAUSE_LOG_ENTRY</label>
                              <textarea 
                                required
                                value={rootCauseInput}
                                onChange={e => setRootCauseInput(e.target.value)}
                                className="w-full h-40 bg-white border-4 border-black p-6 font-black uppercase focus:bg-[#32CD32] transition-colors outline-none shadow-[6px_6px_0_0_black]"
                              />
                           </div>
                           <div className="flex flex-col gap-4">
                              <button type="submit" disabled={resolvingSubmit} className="w-full h-20 bg-black text-white border-4 border-black shadow-[8px_8px_0_0_#32CD32] font-black text-lg flex items-center justify-center gap-4">
                                {resolvingSubmit ? <Loader2 className="w-6 h-6 animate-spin" /> : <>TRANSMIT_RESTORE <ChevronRight className="w-8 h-8 stroke-[4px]" /></>}
                              </button>
                              <button type="button" onClick={() => setIsResolving(false)} className="font-black text-[10px] uppercase underline decoration-2">ABORT_CMD</button>
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
