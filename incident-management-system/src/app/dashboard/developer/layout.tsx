"use client";

import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { LayoutDashboard, AlertCircle, CheckSquare, Bell } from "lucide-react";

const developerNavItems: NavItem[] = [
  { href: "/dashboard/developer", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/developer/notifications", icon: Bell, label: "Notifications" },
  { href: "/dashboard/developer/issues", icon: AlertCircle, label: "My Issues" },
  { href: "/dashboard/developer/resolved", icon: CheckSquare, label: "Resolved" },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#0a0a0c] text-white overflow-hidden selection:bg-emerald-500/20 selection:text-white">
      <Sidebar navItems={developerNavItems} roleTitle="Developer Panel" />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {children}
        </main>
        
        {/* Status Bar */}
        <div className="h-9 bg-[#0a0a0c] border-t border-white/[0.06] flex items-center px-6 shrink-0">
          <div className="flex items-center gap-6 text-[10px] text-zinc-600 font-medium">
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              All systems operational
            </span>
            <span className="text-zinc-700">·</span>
            <span>Developer access</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.08);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255,255,255,0.15);
        }
      `}</style>
    </div>
  );
}
