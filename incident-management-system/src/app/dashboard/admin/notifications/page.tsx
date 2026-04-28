"use client";

import { useState, useEffect } from "react";
import { Bell, CheckCheck, Inbox, ArrowRight, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const token = localStorage.getItem("incident_token");
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` }
      });
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
      const token = localStorage.getItem("incident_token");
      await fetch(`/api/notifications/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (err) {
      console.error(err);
    }
  }

  async function markAllRead() {
    try {
      const token = localStorage.getItem("incident_token");
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
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
        <div className="p-16 text-center border border-white/[0.06] border-dashed rounded-2xl space-y-3">
           <Inbox className="w-12 h-12 mx-auto text-zinc-700" />
           <p className="text-sm text-zinc-500">No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className={cn(
                "p-4 rounded-xl border transition-all flex items-start gap-4",
                n.isRead 
                  ? "border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.03]" 
                  : "border-emerald-500/20 bg-emerald-500/[0.03] hover:bg-emerald-500/[0.06]"
              )}
            >
              <div className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5",
                  n.isRead ? "bg-white/[0.03] border border-white/[0.06]" : "bg-emerald-500/10 border border-emerald-500/20"
              )}>
                <Bell className={cn("w-4 h-4", n.isRead ? "text-zinc-600" : "text-emerald-400")} />
              </div>
              
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-white">{n.title}</h3>
                <p className="text-xs text-zinc-500 mt-0.5">{n.message}</p>
                <div className="flex items-center gap-3 mt-2">
                   <div className="flex items-center gap-1 text-[10px] text-zinc-600">
                      <Clock className="w-3 h-3" />
                      {formatDistanceToNow(new Date(n.createdAt))} ago
                   </div>
                   {!n.isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                   )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                 {n.link && (
                   <button 
                     onClick={() => { markRead(n.id); router.push(n.link!); }}
                     className="flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.06] rounded-lg text-xs font-medium text-zinc-400 hover:text-white hover:bg-white/[0.08] transition-all"
                   >
                     View <ArrowRight className="w-3 h-3" />
                   </button>
                 )}
                 {!n.isRead && (
                   <button 
                      onClick={() => markRead(n.id)}
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
