"use client";

import { Sidebar, NavItem } from "@/components/dashboard/shared/Sidebar";
import { LayoutDashboard, FolderKanban, AlertCircle, Settings } from "lucide-react";

const adminNavItems: NavItem[] = [
  { href: "/dashboard/admin", icon: LayoutDashboard, label: "Overview" },
  { href: "/dashboard/admin/issues", icon: AlertCircle, label: "Issues" },
  { href: "/dashboard/admin/projects", icon: FolderKanban, label: "Projects" },
  { href: "/dashboard/admin/settings", icon: Settings, label: "Settings" },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-background text-foreground overflow-hidden">
      <Sidebar navItems={adminNavItems} roleTitle="Admin Panel" />
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}
