"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Issue } from "./RecentIssues";

export interface TeamData { id: string; name: string; projectId: string; }
export interface DeveloperData { id: string; name?: string | null; email: string; teamId: string | null; }

interface IssueDetailModalProps {
  issue: Issue | null;
  onClose: () => void;
  allowAssign?: boolean;
  teams?: TeamData[];
  developers?: DeveloperData[];
  onAssignSubmit?: (teamId: string, devId: string) => Promise<void>;
  isAssigning?: boolean;
}

export function IssueDetailModal({ 
  issue, 
  onClose, 
  allowAssign, 
  teams = [], 
  developers = [], 
  onAssignSubmit,
  isAssigning 
}: IssueDetailModalProps) {
  const [assignTeamId, setAssignTeamId] = useState("");
  const [assignDevId, setAssignDevId] = useState("");

  useEffect(() => {
    if (issue) {
      setAssignTeamId("");
      setAssignDevId(issue.logs?.suggestedAssigneeId || "");
    }
  }, [issue]);

  if (!issue) return null;

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (onAssignSubmit) {
      await onAssignSubmit(assignTeamId, assignDevId);
    }
  };

  const showAssignForm = allowAssign && issue.status === "OPEN";

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card w-full max-w-2xl rounded-xl border border-border shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-4 border-b border-border flex justify-between items-center">
          <h2 className="font-semibold text-lg text-foreground">Issue Details</h2>
          <button onClick={onClose} className="text-foreground/50 hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[80vh] flex flex-col md:flex-row gap-8">
          {/* Issue Info */}
          <div className="flex-1 space-y-6">
            <div>
              <h3 className="text-xl font-bold tracking-tight text-foreground">{issue.title}</h3>
              <p className="text-sm font-mono text-foreground/40 mt-1">
                STATUS: <span className="text-foreground/80">{issue.status}</span> · SEVERITY: <span className="text-foreground/80">{issue.severity}</span>
              </p>
            </div>
            
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-foreground">Description</h4>
              <p className="text-sm text-foreground/70 bg-accent/30 p-4 rounded-lg whitespace-pre-wrap leading-relaxed">
                {issue.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="block text-foreground/50 mb-1">Assigned Team</span>
                <span className="font-medium">{issue.teamName || "—"}</span>
              </div>
              <div>
                <span className="block text-foreground/50 mb-1">Assigned Developer</span>
                <span className="font-medium">{issue.assignedToEmail || "—"}</span>
              </div>
              <div>
                <span className="block text-foreground/50 mb-1">Created</span>
                <span className="font-medium">{issue.timeAgo}</span>
              </div>
            </div>
          </div>

          {/* Assign Form */}
          {showAssignForm && (
            <div className="w-full md:w-[300px] shrink-0 border-t md:border-t-0 md:border-l border-border pt-6 md:pt-0 md:pl-6">
              <h4 className="font-medium text-primary mb-4">Assign Issue</h4>
              <form onSubmit={handleAssign} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">Assign to Team</label>
                  <select
                    required
                    value={assignTeamId}
                    onChange={(e) => {
                      setAssignTeamId(e.target.value);
                      setAssignDevId("");
                    }}
                    className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                  >
                    <option value="">Select a team...</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {assignTeamId && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Assign to Developer</label>
                    <select
                      value={assignDevId}
                      onChange={(e) => setAssignDevId(e.target.value)}
                      className="w-full px-3 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-foreground"
                    >
                      <option value="">(Unassigned)</option>
                      {developers.filter(d => d.teamId === assignTeamId).map(dev => (
                        <option key={dev.id} value={dev.id}>
                          {dev.name || dev.email}
                          {issue.logs?.suggestedAssigneeId === dev.id ? " (Suggested)" : ""}
                        </option>
                      ))}
                    </select>
                    {issue.logs?.suggestedAssigneeId && !assignDevId && (
                      <p className="text-xs text-amber-500 mt-1">Note: A specific developer was suggested for this issue.</p>
                    )}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isAssigning || !assignTeamId}
                  className="w-full mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center p-2"
                >
                  {isAssigning ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Assignment"}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
