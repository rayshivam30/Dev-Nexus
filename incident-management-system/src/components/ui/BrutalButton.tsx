"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface BrutalButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "info" | "success" | "white" | "outline";
  icon?: LucideIcon;
  fullWidth?: boolean;
}

export function BrutalButton({
  children,
  variant = "white",
  icon: Icon,
  fullWidth = false,
  className,
  ...props
}: BrutalButtonProps) {
  const variants = {
    primary: "bg-emerald-600 text-white hover:bg-emerald-500",
    secondary: "bg-teal-600 text-white hover:bg-teal-500",
    danger: "bg-red-600/80 text-white hover:bg-red-600",
    info: "bg-teal-500/80 text-white hover:bg-teal-500",
    success: "bg-emerald-600 text-white hover:bg-emerald-500",
    white: "bg-white/[0.04] text-white border border-white/[0.08] hover:bg-white/[0.08]",
    outline: "bg-transparent text-zinc-400 border border-white/[0.08] hover:border-white/[0.15] hover:text-white hover:bg-white/[0.03]",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-200",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 mr-0.5" />}
      <span>{children}</span>
    </motion.button>
  );
}
