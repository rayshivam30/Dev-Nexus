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
  // Simple deterministic random sparkline data based on title
  const generateSparkline = () => {
    const points = [];
    const seed = title.length;
    let currentY = 15;
    for (let i = 0; i < 10; i++) {
      points.push(`${i * 10},${currentY}`);
      currentY += (Math.sin(seed + i) * 8);
      currentY = Math.max(2, Math.min(28, currentY));
    }
    return points.join(" ");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className={cn(
        "relative overflow-hidden p-6 rounded-2xl border border-white/[0.06] bg-[#09090b] hover-card-polish group",
        bgClass
      )}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      <div className="relative z-10 flex items-start justify-between">
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-zinc-400 group-hover:text-zinc-300 transition-colors">
            <Icon className={cn("w-4 h-4", color)} />
            <p className="text-[11px] font-semibold uppercase tracking-wider">{title}</p>
          </div>
          <p className="text-4xl font-black tracking-tight text-white">{value}</p>
        </div>
        
        <div className="w-24 h-12 opacity-40 group-hover:opacity-100 transition-opacity duration-500">
          <svg viewBox="0 0 100 30" className="w-full h-full overflow-visible">
            <polyline
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={color}
              points={generateSparkline()}
            />
          </svg>
        </div>
      </div>
    </motion.div>
  );
}
