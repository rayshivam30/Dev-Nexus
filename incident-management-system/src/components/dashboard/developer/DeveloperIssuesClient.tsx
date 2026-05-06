"use client";

import { useRouter } from "next/navigation";
import { RecentIssues, Issue } from "@/components/dashboard/shared/RecentIssues";
import { Zap } from "lucide-react";
import { useToast } from "@/components/ui/ToastProvider";

export function DeveloperIssuesClient({ issues }: { issues: Issue[] }) {
  const router = useRouter();
  const { showToast } = useToast();

  async function handleStatusChange(issueId: string, newStatus: string, rootCause?: string) {
    try {
      const token = localStorage.getItem("incident_token") || "";
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus, rootCause }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update status");
      }
      showToast({
        tone: "success",
        title: newStatus === "RESOLVED" ? "Issue resolved" : "Work started",
        description: newStatus === "RESOLVED" ? "Your resolution was submitted." : "The issue is now in progress.",
      });
      router.refresh();
    } catch (err) {
      showToast({
        tone: "error",
        title: "Update failed",
        description: err instanceof Error ? err.message : "Failed to update status",
      });
    }
  }

  return (
    <div className="space-y-8 pb-24 max-w-[1600px] mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs font-medium text-zinc-500 bg-white/[0.03] border border-white/[0.06] rounded-lg px-3 py-1">
            Assigned Queue
          </span>
          <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
            <Zap className="w-3 h-3" /> Action Required
          </span>
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">
          Assigned Incidents
        </h1>
        <p className="text-sm text-zinc-500 mt-1">
          Review and resolve active tasks assigned specifically to you.
        </p>
      </div>

      <div className="p-6 border border-white/[0.06] bg-[#0a0a0c]/50 rounded-2xl">
        <RecentIssues 
          issues={issues} 
          onStatusChange={handleStatusChange} 
          onRowClick={(issue) => router.push(`/dashboard/developer/issues/${issue.id}`)} 
        />
      </div>
    </div>
  );
}
