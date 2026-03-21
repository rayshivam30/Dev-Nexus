"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

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
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="p-6 rounded-xl border border-border bg-card transition-all hover:bg-accent/50 group"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground/50">{title}</p>
          <p className="text-3xl font-bold mt-2 text-white">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110 ${bgClass}`}>
          <Icon className={`w-6 h-6 ${color}`} />
        </div>
      </div>
    </motion.div>
  );
}
