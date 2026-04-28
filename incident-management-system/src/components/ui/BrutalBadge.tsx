import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BrutalBadgeProps {
  children: ReactNode;
  variant?: "yellow" | "black" | "blue" | "pink" | "red" | "green" | "zinc";
  className?: string;
  size?: "sm" | "md";
}

export function BrutalBadge({
  children,
  variant = "zinc",
  className,
  size = "md"
}: BrutalBadgeProps) {
  const variants = {
    yellow: "bg-amber-400/10 text-amber-400 border-amber-400/20",
    black: "bg-white/10 text-white border-white/10",
    blue: "bg-blue-400/10 text-blue-400 border-blue-400/20",
    pink: "bg-purple-400/10 text-purple-400 border-purple-400/20",
    red: "bg-red-400/10 text-red-400 border-red-400/20",
    green: "bg-emerald-400/10 text-emerald-400 border-emerald-400/20",
    zinc: "bg-zinc-800 text-zinc-400 border-white/5",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-[10px]",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={cn(
      "font-bold tracking-tight border rounded-full inline-flex items-center justify-center",
      variants[variant],
      sizes[size],
      className
    )}>
      {children}
    </span>
  );
}
