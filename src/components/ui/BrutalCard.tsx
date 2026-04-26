import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface BrutalCardProps {
  children: ReactNode;
  title?: string;
  variant?: "white" | "yellow" | "blue" | "pink" | "green";
  className?: string;
  headerClassName?: string;
}

export function BrutalCard({
  children,
  title,
  variant = "white",
  className,
  headerClassName
}: BrutalCardProps) {
  const variants = {
    white: "bg-white",
    yellow: "bg-[#FFD700]",
    blue: "bg-[#00D1FF]",
    pink: "bg-[#FF00FF]",
    green: "bg-[#39FF14]",
  };

  return (
    <div className={cn(
      "border-4 border-black shadow-[8px_8px_0_0_black] overflow-hidden",
      variants[variant],
      className
    )}>
      {title && (
        <div className={cn(
          "px-6 py-3 border-b-4 border-black bg-black text-white font-black uppercase tracking-widest text-sm",
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
