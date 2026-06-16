import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-white/10",
        className
      )}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-3 p-6 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

export function SkeletonTable() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="space-y-2">
        {Array(5)
          .fill(null)
          .map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
      </div>
    </div>
  );
}
