"use client";

import Link from "next/link";
import { LogOut, LucideIcon, User, ChevronRight, Activity } from "lucide-react";
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
    localStorage.removeItem("incident_token");
    document.cookie = "incident_token=; path=/; max-age=0";
    router.push("/auth/login");
  }

  return (
    <aside className="w-72 border-r-4 border-black bg-white flex flex-col h-full hidden md:flex z-50">
      <div className="p-8 border-b-4 border-black bg-[#FFD700]">
        <Link href="/dashboard/admin" className="flex items-center space-x-3 group">
          <div className="w-12 h-12 bg-black border-2 border-black flex items-center justify-center shadow-[4px_4px_0_0_white] group-hover:translate-x-0.5 group-hover:translate-y-0.5 group-hover:shadow-none transition-all">
            <Activity className="w-7 h-7 text-[#FFD700]" />
          </div>
          <div className="flex flex-col">
            <span className="font-[900] text-xl uppercase tracking-tighter italic leading-none">DevNexus_</span>
            <span className="text-[10px] font-black bg-black text-white px-2 py-0.5 w-fit mt-1 uppercase tracking-widest">{roleTitle}</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-10 space-y-4 overflow-y-auto custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center justify-between px-4 py-3 border-2 border-black font-black uppercase text-xs tracking-widest transition-all",
                isActive
                  ? "bg-black text-white shadow-none translate-x-1 translate-y-1" 
                  : "bg-white text-black shadow-[4px_4px_0_0_black] hover:bg-[#00D1FF] hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
              )}
            >
              <div className="flex items-center space-x-4">
                <item.icon className={cn("w-5 h-5", isActive ? "text-[#FFD700]" : "text-black")} />
                <span>{item.label}</span>
              </div>
              {isActive && <ChevronRight className="w-4 h-4 text-[#FFD700]" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t-4 border-black space-y-4 bg-[#F0F0F0]">
        <Link
          href="/dashboard/profile"
          className={cn(
            "group flex items-center justify-between px-4 py-3 border-2 border-black font-black uppercase text-xs tracking-widest transition-all",
            pathname === "/dashboard/profile"
              ? "bg-black text-white shadow-none translate-x-1 translate-y-1"
              : "bg-white text-black shadow-[4px_4px_0_0_black] hover:bg-[#FF00FF] hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none"
          )}
        >
          <div className="flex items-center space-x-4">
             <User className={cn("w-5 h-5", pathname === "/dashboard/profile" ? "text-[#00D1FF]" : "text-black")} />
             <span>Profile</span>
          </div>
        </Link>

        <button
          onClick={handleLogout}
          className="group flex w-full items-center space-x-4 px-4 py-3 border-2 border-black font-black uppercase text-xs tracking-widest bg-white text-black shadow-[4px_4px_0_0_black] hover:bg-[#FF3131] hover:text-white hover:translate-x-0.5 hover:translate-y-0.5 hover:shadow-none transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span>Security_Log_Out</span>
        </button>
      </div>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f0f0f0;
          border-left: 2px solid black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: black;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #444;
        }
      `}</style>
    </aside>
  );
}
