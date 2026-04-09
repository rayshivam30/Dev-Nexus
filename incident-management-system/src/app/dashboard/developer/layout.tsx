"use client";

import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { LayoutDashboard, AlertCircle, CheckSquare } from "lucide-react";

const developerNavItems: NavItem[] = [
  { href: "/dashboard/developer", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/developer/issues", icon: AlertCircle, label: "My Issues" },
  { href: "/dashboard/developer/resolved", icon: CheckSquare, label: "Resolved" },
];

export default function DeveloperLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-[#F0F0F0] text-black overflow-hidden selection:bg-[#FFD700] selection:text-black">
      {/* Grid Background Pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: "linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)", backgroundSize: "30px 30px" }}>
      </div>

      <Sidebar navItems={developerNavItems} roleTitle="Developer Panel" />
      <main className="flex-1 overflow-y-auto p-4 md:p-12 relative z-10 custom-scrollbar">
        <div className="relative w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
