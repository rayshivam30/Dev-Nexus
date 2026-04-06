"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color: string;
  bgClass: string;
  index: number;
}

export function StatCard({ title, value, icon: Icon, color, bgClass, index }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05, duration: 0.2 }}
      className={cn(
        "p-6 border-4 border-black shadow-[8px_8px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group",
        bgClass
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-black/60">{title}</p>
          <p className="text-5xl font-[900] italic tracking-tighter text-black leading-none">{value}</p>
        </div>
        <div className="w-14 h-14 bg-white border-4 border-black flex items-center justify-center -rotate-3 group-hover:rotate-0 transition-transform">
          <Icon className={cn("w-8 h-8", color)} />
        </div>
      </div>
    </motion.div>
  );
}
