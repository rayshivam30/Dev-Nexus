import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-64 w-full items-center justify-center p-12">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 w-12 h-12 rounded-full bg-white/5 blur-xl animate-pulse" />
          <Loader2 className="w-10 h-10 text-white/40 animate-spin relative z-10" />
        </div>
        <p className="font-bold text-[10px] uppercase tracking-[0.2em] text-white/20">Authenticating...</p>
      </div>
    </div>
  );
}
