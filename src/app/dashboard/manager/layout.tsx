"use client";

import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { LayoutDashboard, AlertCircle, Users } from "lucide-react";

const managerNavItems: NavItem[] = [
  { href: "/dashboard/manager", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/manager/issues", icon: AlertCircle, label: "Issues" },
  { href: "/dashboard/manager/team", icon: Users, label: "My Team" },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-white text-black overflow-hidden">
      <Sidebar navItems={managerNavItems} roleTitle="Manager Panel" />
      <main className="flex-1 overflow-y-auto p-6 md:p-10 custom-scrollbar">
        {children}
      </main>
    </div>
  );
}
