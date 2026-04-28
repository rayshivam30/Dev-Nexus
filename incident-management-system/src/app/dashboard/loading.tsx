"use client";

import { Command } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-14 h-14 bg-emerald-600/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center animate-pulse">
        <Command className="w-7 h-7 text-emerald-400" />
      </div>
      <div className="flex flex-col text-center">
        <p className="text-sm text-zinc-500 animate-pulse">Loading...</p>
      </div>
      <div className="w-48 h-1 bg-white/[0.04] rounded-full overflow-hidden">
        <div className="h-full bg-emerald-500/50 rounded-full animate-[slide_1.2s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
      </div>
      <style jsx>{`
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
}
