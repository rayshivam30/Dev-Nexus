"use client";

import { Activity } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
      <div className="w-24 h-24 bg-white border-8 border-black flex items-center justify-center shadow-[10px_10px_0_0_#FFD700] animate-bounce">
        <Activity className="w-12 h-12 text-black animate-pulse" />
      </div>
      <div className="flex flex-col text-center">
        <h2 className="text-4xl font-[900] uppercase italic tracking-tighter animate-pulse">LOADING_DATA</h2>
        <p className="text-xs font-black uppercase text-black/40 tracking-widest mt-2">Connecting to nexus nodes...</p>
      </div>
      <div className="w-64 h-4 border-2 border-black p-0.5 bg-white overflow-hidden flex">
        <div className="h-full bg-black animate-[slide_1s_ease-in-out_infinite]" style={{ width: '40%' }}></div>
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
