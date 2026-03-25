"use client";

import { useState, useMemo } from "react";
import { Loader2, X, AlertCircle } from "lucide-react";

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
      setError("Project is required");
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
      setError(err instanceof Error ? err.message : "Failed to create issue");

    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-background border border-border rounded-xl shadow-lg w-full max-w-md p-6 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center border-b border-border pb-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold">Create Manual Issue</h2>
            <p className="text-[10px] text-foreground/40 font-mono uppercase tracking-widest">Incident Management System</p>
          </div>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {error && (
          <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">Basic Information</label>
              <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-foreground/[0.02]">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Issue Title <span className="text-red-500">*</span></label>
                  <input 
                    required 
                    value={title} 
                    onChange={e=>setTitle(e.target.value)} 
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
                    placeholder="E.g., Database connection timeout" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description <span className="text-red-500">*</span></label>
                  <textarea 
                    required
                    value={description} 
                    onChange={e=>setDescription(e.target.value)} 
                    rows={3}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all resize-none" 
                    placeholder="Detailed description of the problem..." 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">Metadata & Urgency</label>
              <div className="grid grid-cols-2 gap-4 p-3 rounded-lg border border-border/50 bg-foreground/[0.02]">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Severity <span className="text-red-500">*</span></label>
                  <select 
                    value={severity} 
                    onChange={e=>setSeverity(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="CRITICAL">Critical</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Priority <span className="text-red-500">*</span></label>
                  <select 
                    value={priority} 
                    onChange={e=>setPriority(e.target.value)}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
                <div className="col-span-2 space-y-1">
                    <label className="text-sm font-medium">Environment <span className="text-red-500">*</span></label>
                    <select 
                      value={environment} 
                      onChange={e=>setEnvironment(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                    >
                      <option value="PRODUCTION">Production</option>
                      <option value="STAGING">Staging</option>
                      <option value="DEVELOPMENT">Development</option>
                    </select>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold uppercase tracking-widest text-foreground/40">Assignment</label>
              <div className="space-y-3 p-3 rounded-lg border border-border/50 bg-foreground/[0.02]">
                {!fixedProjectId && projects && projects.length > 0 && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Project <span className="text-red-500">*</span></label>
                    <select 
                      value={selectedProjectId} 
                      onChange={e=>{
                        setSelectedProjectId(e.target.value);
                        setSelectedTeamId("");
                        setSelectedDeveloperId("");
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                      required
                    >
                      <option value="">-- Select Project --</option>
                      {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium">Team</label>
                    <select 
                      value={selectedTeamId} 
                      onChange={e=>{
                        setSelectedTeamId(e.target.value);
                        setSelectedDeveloperId("");
                      }}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                      disabled={!fixedProjectId && projects && projects.length > 0 && !selectedProjectId}
                    >
                      <option value="">-- Optional --</option>
                      {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-sm font-medium">Developer</label>
                    <select 
                      value={selectedDeveloperId} 
                      onChange={e=>setSelectedDeveloperId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all"
                      disabled={!selectedTeamId}
                    >
                      <option value="">-- Unassigned --</option>
                      {filteredDevelopers.map(d => <option key={d.id} value={d.id}>{d.name || d.email}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button 
              type="button" 
              onClick={onClose} 
              className="px-4 py-2 border border-border rounded-md font-medium hover:bg-accent/50 transition-colors"
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
              className="px-4 py-2 bg-foreground text-background font-medium rounded-md flex items-center justify-center min-w-[120px] hover:opacity-90 transition-opacity disabled:opacity-50 shadow-lg shadow-foreground/5"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Issue"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
