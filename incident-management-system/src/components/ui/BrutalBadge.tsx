import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BrutalBadgeProps {
  children: ReactNode;
  variant?: "yellow" | "black" | "blue" | "pink" | "red" | "green";
  className?: string;
  size?: "sm" | "md";
}

export function BrutalBadge({
  children,
  variant = "yellow",
  className,
  size = "md"
}: BrutalBadgeProps) {
  const variants = {
    yellow: "bg-[#FFD700] text-black",
    black: "bg-black text-white",
    blue: "bg-[#00D1FF] text-black",
    pink: "bg-[#FF00FF] text-white",
    red: "bg-[#FF3131] text-white",
    green: "bg-[#39FF14] text-black",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-3 py-1 text-xs",
  };

  return (
    <span className={cn(
      "font-black uppercase tracking-widest border-2 border-black inline-block",
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
