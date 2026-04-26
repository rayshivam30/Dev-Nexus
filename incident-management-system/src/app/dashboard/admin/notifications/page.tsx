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
    <div className="space-y-12 max-w-5xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-8 border-black pb-8">
        <div className="space-y-2">
          <h1 className="text-7xl font-[1000] tracking-tighter uppercase italic leading-none text-black flex items-center gap-6">
            <div className="w-12 h-12 bg-black animate-pulse"></div>
            INBOX_CENTRAL
          </h1>
          <p className="text-xl font-black uppercase italic opacity-40 tracking-widest">Incident History & System Alerts_</p>
        </div>
        
        <button 
          onClick={markAllRead}
          className="px-8 py-4 bg-[#FFD700] text-black border-4 border-black font-black uppercase italic text-sm shadow-[8px_8px_0_0_black] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all flex items-center gap-3"
        >
          <CheckCheck className="w-5 h-5 stroke-[3px]" />
          ACKNOWLEDGE_ALL
        </button>
      </div>

      {loading ? (
        <div className="p-20 text-center border-8 border-black border-dashed animate-pulse">
           <p className="text-4xl font-black uppercase italic opacity-20 tracking-tighter text-black">UPLOADING_DATA...</p>
        </div>
      ) : notifications.length === 0 ? (
        <div className="p-20 text-center border-8 border-black border-dashed space-y-6">
           <Inbox className="w-20 h-20 mx-auto opacity-20" />
           <p className="text-4xl font-black uppercase italic opacity-20 tracking-tighter text-black">NO_DATA_RECORDS</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {notifications.map((n) => (
            <div 
              key={n.id}
              className="relative group"
            >
              <div className={cn(
                  "absolute inset-0 border-4 border-black translate-x-2 translate-y-2 -z-10 group-hover:translate-x-1 group-hover:translate-y-1 transition-all",
                  n.isRead ? "bg-white" : "bg-[#FF00FF]"
              )}></div>
              
              <div className={cn(
                  "p-8 border-4 border-black bg-white flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:-translate-x-1 hover:-translate-y-1 transition-all",
                  !n.isRead && "border-r-[16px]"
              )}>
                <div className="flex items-start gap-6 flex-1">
                  <div className={cn(
                      "w-12 h-12 shrink-0 border-4 border-black flex items-center justify-center shadow-[4px_4px_0_0_black]",
                      n.isRead ? "bg-white" : "bg-[#00D1FF]"
                  )}>
                    <Bell className={cn("w-6 h-6", !n.isRead && "animate-bounce")} />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{n.title}</h3>
                    <p className="text-sm font-bold text-black/60 uppercase tracking-widest">{n.message}</p>
                    <div className="flex items-center gap-4 pt-2">
                       <div className="flex items-center gap-1 text-[10px] font-black text-black/40 uppercase">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(n.createdAt))} AGO
                       </div>
                       {!n.isRead && (
                          <span className="bg-black text-white text-[8px] font-black px-2 py-0.5 tracking-widest">UNREAD_LOG</span>
                       )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                   {n.link && (
                     <button 
                       onClick={() => { markRead(n.id); router.push(n.link!); }}
                       className="flex-1 md:flex-none px-6 py-3 bg-black text-white border-2 border-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-[4px_4px_0_0_#FFD700] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all"
                     >
                       INVESTIGATE_INCIDENT <ArrowRight className="w-3 h-3" />
                     </button>
                   )}
                   {!n.isRead && (
                     <button 
                        onClick={() => markRead(n.id)}
                        className="p-3 border-2 border-black hover:bg-black hover:text-white transition-colors"
                        title="Mark as Read"
                     >
                        <CheckCheck className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
