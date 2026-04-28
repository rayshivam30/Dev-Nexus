import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BrutalCardProps {
  children: ReactNode;
  title?: string;
  variant?: "white" | "yellow" | "blue" | "pink" | "green" | "dark" | "glass";
  className?: string;
  headerClassName?: string;
}

export function BrutalCard({
  children,
  title,
  variant = "dark",
  className,
  headerClassName
}: BrutalCardProps) {
  const variants = {
    white: "bg-white text-black border-zinc-200 shadow-xl shadow-black/5",
    yellow: "bg-amber-400 text-black border-amber-500/20 shadow-xl shadow-amber-500/5",
    blue: "bg-blue-500 text-white border-blue-600/20 shadow-xl shadow-blue-500/5",
    pink: "bg-purple-500 text-white border-purple-600/20 shadow-xl shadow-purple-500/5",
    green: "bg-emerald-500 text-white border-emerald-600/20 shadow-xl shadow-emerald-500/5",
    dark: "bg-zinc-900 text-white border-white/5 shadow-2xl",
    glass: "bg-white/[0.02] backdrop-blur-xl text-white border-white/10 shadow-2xl",
  };

  return (
    <div className={cn(
      "border rounded-3xl overflow-hidden transition-all duration-300",
      variants[variant],
      className
    )}>
      {title && (
        <div className={cn(
          "px-6 py-4 border-b border-white/5 bg-white/5 text-sm font-bold tracking-tight",
          headerClassName
        )}>
          {title}
        </div>
      )}
      <div className="p-6">
        {children}
      </div>
    </div>
  );
}
