"use client";

import { useState, useMemo } from "react";
import { Loader2, X, AlertCircle, Plus, Terminal, Database, Shield, ChevronDown } from "lucide-react";
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
      setError("CRITICAL: PROJECT_ID_MISSING");
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
      if (!res.ok) throw new Error(data.error || "UPLINK_FAILURE: DATA_REJECTED");
      
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "UPLINK_FAILURE: SYSTEM_TIMEOUT");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4 md:p-8 overflow-y-auto custom-scrollbar animate-in fade-in duration-300 backdrop-blur-sm">
      <div className="bg-white border-[10px] border-black shadow-[30px_30px_0_0_#FFD700] w-full max-w-4xl animate-in zoom-in-95 duration-300 my-auto relative">
        
        {/* TOP STATUS BAR */}
        <div className="bg-black text-white px-6 py-2 flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
           <div className="flex items-center gap-4">
              <span className="text-[#FFD700] animate-pulse">● LIVE_CONNECTION</span>
              <span>BUFFER_ID: {Math.random().toString(36).substring(7).toUpperCase()}</span>
           </div>
           <div className="opacity-40">ENCRYPTION: AES_256_ACTIVE</div>
        </div>

        <div className="p-8 md:p-12 space-y-12">
          {/* Header Section */}
          <div className="flex justify-between items-start border-b-8 border-black pb-8">
            <div className="space-y-4">
              <h2 className="text-5xl md:text-7xl font-[900] uppercase italic tracking-tighter leading-none text-black">
                NEW_INCIDENT <br />
                <span className="text-2xl md:text-3xl bg-black text-white px-4 py-1 inline-block mt-2 -rotate-1">LOG_SUBSYSTEM</span>
              </h2>
            </div>
            <button onClick={onClose} className="p-3 border-4 border-black bg-white hover:bg-[#FF3131] hover:text-white transition-all shadow-[8px_8px_0_0_black] active:translate-x-1 active:translate-y-1 active:shadow-none">
              <X className="w-10 h-10 stroke-[4px]" />
            </button>
          </div>
          
          {error && (
            <div className="p-6 bg-[#FF3131] text-white border-4 border-black font-black uppercase text-xs shadow-[8px_8px_0_0_black] flex items-center gap-6 italic">
              <div className="bg-white text-[#FF3131] p-2 border-2 border-black">
                <AlertCircle className="w-8 h-8 stroke-[3px]" />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-black underline underline-offset-4 decoration-2">SYSTEM_ERROR_DETECTED</span>
                <span className="opacity-90">{error}</span>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              
              {/* LEFT COLUMN: PRIMARY INPUTS */}
              <div className="lg:col-span-7 space-y-10">
                <div className="space-y-3 p-8 border-4 border-black bg-[#F8F8F8] shadow-[10px_10px_0_0_black]">
                  <div className="flex items-center gap-3 mb-4">
                    <Terminal className="w-6 h-6" />
                    <h3 className="font-black uppercase tracking-widest text-sm">IDENTIFICATION_DATA</h3>
                  </div>
                  
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">INCIDENT_NAME_PROTOCOL</label>
                      <input 
                        required 
                        value={title} 
                        onChange={e=>setTitle(e.target.value)} 
                        className="w-full h-16 px-6 bg-white border-4 border-black font-black uppercase italic text-sm focus:bg-[#FFD700] transition-all shadow-[6px_6px_0_0_black] focus:shadow-none focus:translate-x-1 focus:translate-y-1 placeholder:text-black/10 outline-none" 
                        placeholder="E.G. DB_QUERY_TIMEOUT_P0" 
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">DETAILED_FRAGMENT_REPORT</label>
                      <textarea 
                        required
                        value={description} 
                        onChange={e=>setDescription(e.target.value)} 
                        rows={8}
                        className="w-full p-6 bg-white border-4 border-black font-black uppercase italic text-sm focus:bg-[#FFD700] transition-all shadow-[6px_6px_0_0_black] focus:shadow-none focus:translate-x-1 focus:translate-y-1 resize-none placeholder:text-black/10 outline-none" 
                        placeholder="PROVIDE_REPLICATION_STEPS..." 
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT COLUMN: PARAMETERS */}
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-3 p-8 border-4 border-black bg-white shadow-[10px_10px_0_0_#00D1FF]">
                  <div className="flex items-center gap-3 mb-4">
                    <Shield className="w-6 h-6 text-[#FF00FF]" />
                    <h3 className="font-black uppercase tracking-widest text-sm text-[#FF00FF]">MISSION_PARAMETERS</h3>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">SEVERITY</label>
                        <div className="relative">
                          <select 
                            value={severity} 
                            onChange={e=>setSeverity(e.target.value)}
                            className="w-full h-14 px-4 bg-white border-4 border-black font-black uppercase text-sm focus:bg-[#FF3131] focus:text-white transition-all shadow-[4px_4px_0_0_black] focus:translate-x-1 focus:translate-y-1 focus:shadow-none cursor-pointer outline-none appearance-none"
                          >
                            <option value="LOW">LOW_PRIO</option>
                            <option value="MEDIUM">MEDIUM</option>
                            <option value="HIGH">HIGH_ALERT</option>
                            <option value="CRITICAL">CRITICAL_ERROR</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none stroke-[3px]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">PRIORITY</label>
                        <div className="relative">
                          <select 
                            value={priority} 
                            onChange={e=>setPriority(e.target.value)}
                            className="w-full h-14 px-4 bg-white border-4 border-black font-black uppercase text-sm focus:bg-[#FF00FF] focus:text-white transition-all shadow-[4px_4px_0_0_black] focus:translate-x-1 focus:translate-y-1 focus:shadow-none cursor-pointer outline-none appearance-none"
                          >
                            <option value="LOW">PLAN_B</option>
                            <option value="MEDIUM">STANDARD</option>
                            <option value="HIGH">URGENT</option>
                            <option value="URGENT">IMMEDIATE</option>
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none stroke-[3px]" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">ZONE_ENVIRONMENT</label>
                      <div className="grid grid-cols-3 gap-2">
                        {['PRODUCTION', 'STAGING', 'DEVELOPMENT'].map(env => (
                          <button
                            key={env}
                            type="button"
                            onClick={() => setEnvironment(env)}
                            className={cn(
                              "h-12 border-4 border-black font-black uppercase italic text-[9px] transition-all shadow-[4px_4px_0_0_black] active:shadow-none active:translate-x-1 active:translate-y-1",
                              environment === env ? "bg-[#00D1FF] text-white translate-x-1 translate-y-1 shadow-none" : "bg-white text-black hover:bg-black hover:text-white"
                            )}
                          >
                            {env.substring(0, 4)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ALLOCATION BLOCK */}
                <div className="space-y-3 p-8 border-4 border-black bg-white shadow-[10px_10px_0_0_#32CD32]">
                  <div className="flex items-center gap-3 mb-4">
                    <Database className="w-6 h-6 text-[#32CD32]" />
                    <h3 className="font-black uppercase tracking-widest text-sm text-[#32CD32]">NODE_ALLOCATION</h3>
                  </div>

                  <div className="space-y-6">
                    {!fixedProjectId && projects && projects.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">PROJECT_TARGET</label>
                        <div className="relative">
                          <select 
                            value={selectedProjectId} 
                            onChange={e=>{
                              setSelectedProjectId(e.target.value);
                              setSelectedTeamId("");
                              setSelectedDeveloperId("");
                            }}
                            className="w-full h-14 px-5 bg-white border-4 border-black font-black uppercase text-sm focus:bg-[#FFD700] transition-all shadow-[4px_4px_0_0_black] focus:translate-x-1 focus:translate-y-1 focus:shadow-none cursor-pointer outline-none appearance-none"
                            required
                          >
                            <option value="">-- SELECT_TARGET_NODE --</option>
                            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none stroke-[3px]" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">CLUSTER</label>
                        <div className="relative">
                          <select 
                            value={selectedTeamId} 
                            onChange={e=>{
                              setSelectedTeamId(e.target.value);
                              setSelectedDeveloperId("");
                            }}
                            className="w-full h-14 px-4 bg-white border-4 border-black font-black uppercase text-sm focus:bg-[#FF00FF] focus:text-white transition-all shadow-[4px_4px_0_0_black] focus:translate-x-1 focus:translate-y-1 focus:shadow-none cursor-pointer disabled:opacity-20 outline-none appearance-none"
                            disabled={!fixedProjectId && projects && projects.length > 0 && !selectedProjectId}
                          >
                            <option value="">NO_CLUSTER</option>
                            {filteredTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none stroke-[3px]" />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-black/40 px-1">OPERATOR</label>
                        <div className="relative">
                          <select 
                            value={selectedDeveloperId} 
                            onChange={e=>setSelectedDeveloperId(e.target.value)}
                            className="w-full h-14 px-4 bg-white border-4 border-black font-black uppercase text-sm focus:bg-[#32CD32] transition-all shadow-[4px_4px_0_0_black] focus:translate-x-1 focus:translate-y-1 focus:shadow-none cursor-pointer disabled:opacity-20 outline-none appearance-none"
                            disabled={!selectedTeamId}
                          >
                            <option value="">PENDING</option>
                            {filteredDevelopers.map(d => <option key={d.id} value={d.id}>{d.name || d.email}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 pointer-events-none stroke-[3px]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-12 flex flex-col sm:flex-row justify-end items-center gap-12 border-t-8 border-black">
              <button 
                type="button" 
                onClick={onClose} 
                className="font-black uppercase underline underline-offset-8 decoration-4 hover:bg-black hover:text-white px-8 py-4 transition-all text-xl italic tracking-tighter"
              >
                ABORT_MISSION
              </button>
              <button 
                type="submit" 
                disabled={
                  submitting ||
                  !title.trim() ||
                  !description.trim() ||
                  (projectRequired && !selectedProjectId)
                } 
                className="w-full sm:w-[400px] h-24 bg-black text-white font-[900] uppercase italic tracking-widest border-4 border-black shadow-[15px_15px_0_0_#FFD700] hover:bg-[#FFD700] hover:text-black hover:shadow-none hover:translate-x-2 hover:translate-y-2 active:scale-[0.98] transition-all flex items-center justify-center gap-8 disabled:opacity-20 text-3xl"
              >
                {submitting ? <Loader2 className="w-10 h-10 animate-spin" /> : <>EXECUTE_LOG <Plus className="w-12 h-12 stroke-[5px]" /></>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
