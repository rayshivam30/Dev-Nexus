"use client";

import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { LayoutDashboard, FolderKanban, AlertCircle, Activity, ShieldCheck, Terminal } from "lucide-react";

const adminNavItems: NavItem[] = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/admin/issues", icon: AlertCircle, label: "Issues" },
  { href: "/dashboard/admin/projects", icon: FolderKanban, label: "Projects" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F0F0F0] text-black overflow-hidden selection:bg-[#FFD700] selection:text-black">
      {/* Grid Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: "linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px" }}>
      </div>

      <Sidebar navItems={adminNavItems} roleTitle="Admin Panel" />
      
      <div className="flex-1 flex flex-col min-w-0 relative z-10 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
          {children}
        </main>
        
        {/* Bottom Ticker Bar */}
        <div className="h-10 bg-black border-t-4 border-black flex items-center overflow-hidden shrink-0">
          <div className="flex items-center gap-12 animate-marquee whitespace-nowrap text-white text-[10px] font-black uppercase tracking-widest px-6">
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#FFD700]" /> SYSTEM_STATUS: OPERATIONAL</span>
            <span className="flex items-center gap-2 text-[#00D1FF]"><ShieldCheck className="w-3 h-3" /> UPLINK_STABLE: 100%_SECURED</span>
            <span className="flex items-center gap-2 text-[#FF00FF]"><Terminal className="w-3 h-3" /> NODE_ACCESS: ADMIN_LEVEL_GRANTED</span>
            <span className="flex items-center gap-2"><Activity className="w-3 h-3 text-[#FFD700]" /> SYSTEM_STATUS: OPERATIONAL</span>
            <span className="flex items-center gap-2 text-[#00D1FF]"><ShieldCheck className="w-3 h-3" /> UPLINK_STABLE: 100%_SECURED</span>
            <span className="flex items-center gap-2 text-[#FF00FF]"><Terminal className="w-3 h-3" /> NODE_ACCESS: ADMIN_LEVEL_GRANTED</span>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 12px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-left: 4px solid black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: black;
          border: 2px solid white;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333;
        }
      `}</style>
    </div>
  );
}
