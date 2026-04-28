"use client";

import { useState, useMemo } from "react";
import { Loader2, X, AlertCircle, Plus, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ProjectData { id: string; name: string; }
export interface TeamData { id: string; name: string; projectId: string; }
export interface DeveloperData { id: string; name?: string | null; email: string; teamId: string | null; }

export interface CreateIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  
  projects?: ProjectData[];
  teams?: TeamData[];
  developers?: DeveloperData[];
  
  fixedProjectId?: string;
  fixedTeamId?: string;
}

export function CreateIssueModal({
  isOpen,
  onClose,
  onSuccess,
  projects,
  teams,
  developers,
  fixedProjectId,
  fixedTeamId
}: CreateIssueModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState("LOW");
  const [priority, setPriority] = useState("MEDIUM");
  const [environment, setEnvironment] = useState("PRODUCTION");
  
  const [selectedProjectId, setSelectedProjectId] = useState(fixedProjectId || "");
  const [selectedTeamId, setSelectedTeamId] = useState(fixedTeamId || "");
  const [selectedDeveloperId, setSelectedDeveloperId] = useState("");
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const filteredTeams = useMemo(() => {
    if (!teams) return [];
    if (selectedProjectId) return teams.filter(t => t.projectId === selectedProjectId);
    return teams;
  }, [teams, selectedProjectId]);

  const filteredDevelopers = useMemo(() => {
    if (!developers) return [];
    if (selectedTeamId) return developers.filter(d => d.teamId === selectedTeamId);
    return developers;
  }, [developers, selectedTeamId]);

  if (!isOpen) return null;

  const projectRequired = !fixedProjectId && projects && projects.length > 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (projectRequired && !selectedProjectId) {
      setError("Please select a project.");
      return;
    }

    setSubmitting(true);
    
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          severity,
          priority,
          environment,
          projectId: selectedProjectId,
          teamId: selectedTeamId || undefined,
          assignedToId: selectedDeveloperId || undefined
        })
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create issue");
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass = "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm transition-all focus:outline-none focus:border-white/20 placeholder:text-zinc-700";
  const selectClass = "w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm transition-all focus:outline-none focus:border-white/20 cursor-pointer appearance-none disabled:opacity-30";
  const labelClass = "text-xs text-zinc-500 ml-1 mb-1.5 block";

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-md p-4 md:p-8 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-[#111113] border border-white/[0.08] rounded-2xl w-full max-w-3xl animate-in zoom-in-95 duration-200 my-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/[0.06]">
          <div>
            <h2 className="text-xl font-bold tracking-tight">New Incident</h2>
            <p className="text-xs text-zinc-600 mt-0.5">Create a new issue to track</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-600 hover:text-white hover:bg-white/[0.06] rounded-lg transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-3">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title & Description */}
            <div className="space-y-4">
              <div>
                <label className={labelClass}>Title *</label>
                <input 
                  required 
                  value={title} 
                  onChange={e=>setTitle(e.target.value)} 
                  className={inputClass} 
                  placeholder="e.g. Database connection timeout" 
                />
              </div>
              
              <div>
                <label className={labelClass}>Description *</label>
                <textarea 
                  required
                  value={description} 
                  onChange={e=>setDescription(e.target.value)} 
                  rows={5}
                  className={cn(inputClass, "resize-none")} 
                  placeholder="Describe the issue, steps to reproduce..." 
                />
              </div>
            </div>

            {/* Parameters row */}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelClass}>Severity</label>
                <div className="relative">
                  <select value={severity} onChange={e=>setSeverity(e.target.value)} className={selectClass}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-600" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Priority</label>
                <div className="relative">
                  <select value={priority} onChange={e=>setPriority(e.target.value)} className={selectClass}>
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-600" />
                </div>
              </div>
              <div>
                <label className={labelClass}>Environment</label>
                <div className="flex gap-1.5">
                  {['PRODUCTION', 'STAGING', 'DEVELOPMENT'].map(env => (
                    <button
                      key={env}
                      type="button"
                      onClick={() => setEnvironment(env)}
                      className={cn(
                        "flex-1 py-3 rounded-lg text-[10px] font-medium transition-all border",
                        environment === env 
                          ? "bg-white text-black border-white" 
                          : "bg-white/[0.02] text-zinc-500 border-white/[0.06] hover:bg-white/[0.04]"
                      )}
                    >
                      {env.slice(0, 4)}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Assignment */}
            <div className="space-y-3 pt-4 border-t border-white/[0.06]">
              <p className="text-xs text-zinc-500 font-medium">Assignment (optional)</p>
              
              {!fixedProjectId && projects && projects.length > 0 && (
                <div>
                  <label className={labelClass}>Project *</label>
                  <div className="relative">
                    <select 
                      value={selectedProjectId} 
                      onChange={e=>{
                        setSelectedProjectId(e.target.value);
                        setSelectedTeamId("");
                        setSelectedDeveloperId("");
                      }}
                      className={selectClass}
                      required
                    >
                      <option value="">Select project...</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-600" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelClass}>Team</label>
                  <div className="relative">
                    <select 
                      value={selectedTeamId} 
                      onChange={e=>{
                        setSelectedTeamId(e.target.value);
                        setSelectedDeveloperId("");
                      }}
                      className={selectClass}
                      disabled={!fixedProjectId && projects && projects.length > 0 && !selectedProjectId}
                    >
                      <option value="">None</option>
                      {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-600" />
                  </div>
                </div>

                <div>
                  <label className={labelClass}>Assignee</label>
                  <div className="relative">
                    <select 
                      value={selectedDeveloperId} 
                      onChange={e=>setSelectedDeveloperId(e.target.value)}
                      className={selectClass}
                      disabled={!selectedTeamId}
                    >
                      <option value="">Unassigned</option>
                      {filteredDevelopers.map(d => <option key={d.id} value={d.id}>{d.name || d.email}</option>)}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-zinc-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-white/[0.06]">
              <button 
                type="button" 
                onClick={onClose} 
                className="px-5 py-2.5 rounded-xl text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={
                  submitting ||
                  !title.trim() ||
                  !description.trim() ||
                  (projectRequired && !selectedProjectId)
                } 
                className="px-6 py-2.5 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-30 flex items-center gap-2"
              >
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Create Issue</>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
