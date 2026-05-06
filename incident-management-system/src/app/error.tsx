"use client";

import { useEffect } from "react";
import { AlertTriangle, Home, RefreshCcw } from "lucide-react";
import Link from "next/link";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Boundary caught:", error);
    
    // Telemetry - Ingest our own crashes into DevNexus!
    const sdkKey = process.env.NEXT_PUBLIC_DEVNEXUS_SDK_KEY;
    if (sdkKey) {
      fetch("/api/ingest", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${sdkKey}`,
        },
        body: JSON.stringify({
          message: `Frontend Crash: ${error.message}`,
          stack: error.stack,
          source: "SDK",
          browserInfo: { url: window.location.href, userAgent: navigator.userAgent },
          tags: { component: "ErrorBoundary", route: window.location.pathname }
        })
      }).catch((e) => console.error("Telemetry failed:", e));
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white flex flex-col items-center justify-center p-6 selection:bg-white/10 selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      <div className="max-w-md w-full bg-white/[0.02] border border-white/[0.06] p-8 rounded-2xl relative z-10 space-y-6">
        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400">
          <AlertTriangle className="w-6 h-6 shrink-0" />
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider leading-none">System Crash</h1>
            <p className="text-[10px] opacity-70 mt-1 uppercase tracking-widest">Runtime Exception Encountered</p>
          </div>
        </div>
        
        <div className="bg-black border border-white/[0.06] text-red-400/90 p-4 font-mono text-xs rounded-xl overflow-auto max-h-32 leading-relaxed">
          {error.message || "Unknown Application Error"}
        </div>

        <div className="flex flex-col space-y-3">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center h-11 bg-white text-black font-semibold text-sm rounded-xl hover:bg-zinc-200 transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Restart Sequence
          </button>
          <Link
            href="/"
            className="flex items-center justify-center h-11 bg-white/[0.04] text-white border border-white/[0.08] font-semibold text-sm rounded-xl hover:bg-white/[0.08] transition-colors"
          >
            <Home className="w-4 h-4 mr-2" />
            Return to Dashboard
          </Link>
        </div>
      </div>
      <div className="mt-8 text-[10px] font-semibold uppercase tracking-widest text-zinc-600 z-10">DevNexus Incident Management</div>
    </div>
  );
}
