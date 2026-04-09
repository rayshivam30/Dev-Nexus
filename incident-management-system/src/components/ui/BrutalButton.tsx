"use client";

import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";
import { ReactNode } from "react";
import { motion, HTMLMotionProps } from "framer-motion";

interface BrutalButtonProps extends HTMLMotionProps<"button"> {
  children: ReactNode;
  variant?: "primary" | "secondary" | "danger" | "info" | "success" | "white";
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
    primary: "bg-[#FFD700] text-black shadow-[4px_4px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1",
    secondary: "bg-[#FF00FF] text-white shadow-[4px_4px_0_0_black] hover:bg-black hover:shadow-none hover:translate-x-1 hover:translate-y-1",
    danger: "bg-[#FF3131] text-white shadow-[4px_4px_0_0_black] hover:bg-black hover:shadow-none hover:translate-x-1 hover:translate-y-1",
    info: "bg-[#00D1FF] text-black shadow-[4px_4px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1",
    success: "bg-[#39FF14] text-black shadow-[4px_4px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1",
    white: "bg-white text-black shadow-[4px_4px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1",
  };

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      className={cn(
        "flex items-center justify-center space-x-2 px-6 py-3 border-2 border-black font-black uppercase text-sm tracking-widest transition-all",
        variants[variant],
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {Icon && <Icon className="w-5 h-5" />}
      <span>{children}</span>
    </motion.button>
  );
}
