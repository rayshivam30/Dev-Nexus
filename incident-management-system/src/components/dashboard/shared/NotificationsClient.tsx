"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { ArrowRight, Bell, CheckCheck, Clock, Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import { EmptyState } from "@/components/dashboard/shared/EmptyState";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export function NotificationsClient() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  const roleBase = pathname.match(/\/dashboard\/(admin|manager|developer)/)?.[0] || "/dashboard";

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (res.ok) setNotifications(data.notifications);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function markRead(id: string) {
    try {
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  function getScopedLink(link: string) {
    if (!link.startsWith("/dashboard/admin/issues")) return link;
    if (roleBase === "/dashboard/admin") return link;
    if (roleBase === "/dashboard/developer") return link.replace("/dashboard/admin", "/dashboard/developer");
    return "/dashboard/manager/issues";
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Notifications</h1>
          <p className="text-sm text-zinc-500 mt-1">Incident history &amp; system alerts</p>
        </div>

        <button
          onClick={markAllRead}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-zinc-400 border border-white/[0.06] hover:bg-white/[0.04] hover:text-white transition-all"
        >
          <CheckCheck className="w-4 h-4" />
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="p-16 text-center border border-white/[0.06] border-dashed rounded-2xl">
          <p className="text-sm text-zinc-600 animate-pulse">Loading notifications...</p>
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="All clear"
          description="You have no notifications. When incidents are created, assigned, or resolved, you'll see updates here."
        />
      ) : (
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cn(
                "p-4 rounded-xl border transition-all hover-card-polish flex items-start gap-4",
                notification.isRead
                  ? "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]"
                  : "border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]"
              )}
            >
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                notification.isRead ? "bg-white/[0.03] border border-white/[0.06]" : "bg-emerald-500/10 border border-emerald-500/20"
              )}>
                <Bell className={cn("w-4 h-4", notification.isRead ? "text-zinc-600" : "text-emerald-400")} />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{notification.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{notification.message}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(notification.createdAt))} ago
                  </div>
                  {!notification.isRead && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {notification.link && (
                  <button
                    onClick={() => {
                      markRead(notification.id);
                      router.push(getScopedLink(notification.link!));
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
                  >
                    View <ArrowRight className="w-3 h-3" />
                  </button>
                )}
                {!notification.isRead && (
                  <button
                    onClick={() => markRead(notification.id)}
                    className="p-1.5 rounded-lg text-zinc-600 hover:text-white hover:bg-white/[0.06] transition-all"
                    title="Mark as Read"
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
