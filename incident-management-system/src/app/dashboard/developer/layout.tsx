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
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar navItems={developerNavItems} roleTitle="Developer Panel" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
