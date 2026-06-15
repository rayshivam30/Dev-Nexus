"use client";

import Link from "next/link";
import { LogOut, LucideIcon, User, Command, Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

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
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Derive role-specific profile path from the current route
  const roleBase = pathname.match(/\/dashboard\/(admin|manager|developer)/)?.[0] || "/dashboard";
  const profileHref = `${roleBase}/profile`;
  const isProfileActive = pathname.includes("/profile");

  useEffect(() => {
    let isMounted = true;

    async function fetchUnreadCount() {
      try {
        const res = await fetch("/api/notifications");

        if (!res.ok) return;

        const data = await res.json();
        if (isMounted) {
          setUnreadCount(typeof data.unreadCount === "number" ? data.unreadCount : 0);
        }
      } catch (error) {
        console.error("Failed to fetch unread notifications", error);
      }
    }

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 15000);
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    };
    window.addEventListener("focus", fetchUnreadCount);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      isMounted = false;
      clearInterval(interval);
      window.removeEventListener("focus", fetchUnreadCount);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  async function handleLogout() {
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (res.ok) {
        router.push("/auth/login");
        router.refresh();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  }

  return (
    <>
      {/* Mobile Top Nav */}
      <div className="md:hidden flex items-center justify-between p-4 border-b border-white/[0.06] bg-[#0a0a0c] sticky top-0 z-50">
        <Link href="/dashboard" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
            <Command className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-lg tracking-tight">DevNexus</span>
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 text-white hover:bg-white/5 rounded-lg transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="md:hidden fixed inset-0 z-[100] bg-[#0a0a0c] flex flex-col"
          >
            <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight">DevNexus</span>
                <span className="text-[10px] font-medium text-zinc-500 mt-1">{roleTitle}</span>
              </div>
              <button 
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 text-white hover:bg-white/5 rounded-lg"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <nav className="flex-1 p-6 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = (pathname === item.href || pathname.startsWith(item.href + '/')) && !pathname.includes('/profile');
                const showNotificationBadge = item.href.includes("/notifications") && unreadCount > 0;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                      isActive
                        ? "bg-white/10 text-white" 
                        : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
                    )}
                    >
                      <div className="flex items-center space-x-4">
                        <item.icon className={cn("w-5 h-5", isActive ? "text-emerald-400" : "text-zinc-500")} />
                        <span>{item.label}</span>
                      </div>
                    <div className="flex items-center gap-2">
                      {showNotificationBadge && (
                        <span className="min-w-5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-black">
                          {unreadCount > 99 ? "99+" : unreadCount}
                        </span>
                      )}
                      {isActive && <div className="w-1 h-4 bg-emerald-500 rounded-full" />}
                    </div>
                  </Link>
                );
              })}
            </nav>

            <div className="p-6 border-t border-white/[0.06] space-y-3">
              <Link
                href={profileHref}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all",
                  isProfileActive
                    ? "bg-white/10 text-white" 
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center space-x-4">
                   <User className="w-5 h-5 text-zinc-500" />
                   <span>Profile Settings</span>
                </div>
              </Link>

              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="w-72 border-r border-white/[0.06] bg-[#0a0a0c] flex-col h-full hidden md:flex z-50">
        <div className="p-8 border-b border-white/[0.06]">
          <Link href="/dashboard" className="flex items-center space-x-3 group">
            <motion.div 
              whileHover={{ rotate: 12 }}
              className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center"
            >
              <Command className="w-5 h-5 text-white" />
            </motion.div>
            <div className="flex flex-col">
              <span className="font-bold text-lg tracking-tight">DevNexus</span>
              <span className="text-[10px] font-medium text-zinc-500">{roleTitle}</span>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => {
            const isActive = (pathname === item.href || pathname.startsWith(item.href + '/')) && !pathname.includes('/profile');
            const showNotificationBadge = item.href.includes("/notifications") && unreadCount > 0;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-white/[0.06] text-white" 
                    : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
                )}
              >
                <div className="flex items-center space-x-3">
                  <item.icon className={cn("w-4 h-4 transition-colors", isActive ? "text-emerald-400" : "text-zinc-600 group-hover:text-white")} />
                  <span>{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  {showNotificationBadge && (
                    <span className="min-w-5 rounded-full bg-emerald-500 px-1.5 py-0.5 text-center text-[10px] font-semibold leading-none text-black">
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                  {isActive && (
                    <motion.div layoutId="active-pill" className="w-1 h-4 bg-emerald-500 rounded-full" />
                  )}
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-white/[0.06] space-y-3">
          <Link
            href={profileHref}
            className={cn(
              "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200",
              isProfileActive
                ? "bg-white/[0.06] text-white"
                : "text-zinc-500 hover:text-white hover:bg-white/[0.03]"
            )}
          >
            <div className="flex items-center space-x-3">
               <User className="w-4 h-4 text-zinc-600" />
               <span>Profile Settings</span>
            </div>
          </Link>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.06] transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
