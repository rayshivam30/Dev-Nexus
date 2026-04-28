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
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04] transition-all group",
        bgClass
      )}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{title}</p>
          <p className="text-3xl font-extrabold tracking-tight text-white">{value}</p>
        </div>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center bg-white/[0.04]", bgClass)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
      </div>
    </motion.div>
  );
}
