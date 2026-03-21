"use client";

import Link from "next/link";
import { LogOut, ShieldAlert, LucideIcon, User, ChevronRight } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
    localStorage.removeItem("incident_token");
    document.cookie = "incident_token=; path=/; max-age=0";
    router.push("/auth/login");
  }

  return (
    <aside className="w-68 border-r border-border/50 bg-card/10 backdrop-blur-xl flex flex-col h-full hidden md:flex transition-all duration-300">
      <div className="p-6 flex items-center space-x-3 border-b border-border/30 bg-accent/10">
        <motion.div 
          whileHover={{ rotate: 5, scale: 1.05 }}
          className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/20"
        >
          <ShieldAlert className="w-5 h-5 text-primary-foreground" />
        </motion.div>
        <div className="flex flex-col">
          <span className="font-extrabold text-sm uppercase tracking-widest text-foreground">AI Nexus</span>
          <span className="text-[10px] font-bold text-foreground/40 bg-accent/30 px-1.5 py-0.5 rounded-full inline-block mt-0.5">{roleTitle}</span>
        </div>
      </div>

      <nav className="flex-1 px-4 py-8 space-y-2 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300",
                isActive
                  ? "bg-primary/10 text-primary shadow-sm" 
                  : "text-foreground/50 hover:bg-accent/30 hover:text-foreground"
              )}
            >
              <div className="flex items-center space-x-3">
                <item.icon className={cn("w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-primary" : "text-foreground/40")} />
                <span className="text-sm font-semibold">{item.label}</span>
              </div>
              {isActive && (
                <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-6 bg-primary rounded-full" />
              )}
              {isActive && <ChevronRight className="w-3.5 h-3.5 text-primary/50" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border/30 space-y-2 bg-accent/5">
        <Link
          href="/dashboard/profile"
          className={cn(
            "group flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-300",
            pathname === "/dashboard/profile"
              ? "bg-primary/10 text-primary shadow-sm"
              : "text-foreground/50 hover:bg-accent/30 hover:text-foreground"
          )}
        >
          <div className="flex items-center space-x-3">
             <User className={cn("w-4.5 h-4.5 transition-transform duration-300 group-hover:scale-110", pathname === "/dashboard/profile" ? "text-primary" : "text-foreground/40")} />
             <span className="text-sm font-semibold">Profile</span>
          </div>
          {pathname === "/dashboard/profile" && <ChevronRight className="w-3.5 h-3.5 text-primary/50" />}
        </Link>

        <button
          onClick={handleLogout}
          className="group flex w-full items-center space-x-3 px-3 py-2.5 rounded-xl transition-all duration-300 text-foreground/40 hover:bg-destructive/10 hover:text-destructive"
        >
          <LogOut className="w-4.5 h-4.5 transition-transform duration-300 group-hover:-translate-x-0.5" />
          <span className="text-sm font-semibold">Logout</span>
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(var(--foreground), 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(var(--foreground), 0.1);
        }
      `}</style>
    </aside>
  );
}
