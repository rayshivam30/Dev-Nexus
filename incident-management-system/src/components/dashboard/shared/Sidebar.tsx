"use client";

import Link from "next/link";
import { LogOut, ShieldAlert, LucideIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export interface NavItem {
  href: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  navItems: NavItem[];
  roleTitle: string;
}

export function Sidebar({ navItems, roleTitle }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  function handleLogout() {
    // Clear localStorage
    localStorage.removeItem("incident_token");
    // Clear cookie
    document.cookie = "incident_token=; path=/; max-age=0";
    // Redirect to login
    router.push("/auth/login");
  }

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col h-full hidden md:flex">
      <div className="p-6 flex items-center space-x-3 border-b border-border">
        <div className="w-8 h-8 rounded bg-accent flex items-center justify-center">
          <ShieldAlert className="w-4 h-4" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-sm uppercase tracking-wide">AI Incident</span>
          <span className="text-xs text-foreground/60">{roleTitle}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-6 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-md transition-colors",
                isActive
                  ? "bg-accent text-foreground font-medium" 
                  : "text-foreground/70 hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              <span className="text-sm">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <button
          onClick={handleLogout}
          className="flex w-full items-center space-x-3 px-3 py-2 rounded-md hover:bg-accent/50 transition-colors text-foreground/70 hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="text-sm">Logout</span>
        </button>
      </div>
    </aside>
  );
}
