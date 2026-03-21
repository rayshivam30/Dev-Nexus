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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar navItems={managerNavItems} roleTitle="Manager Panel" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
