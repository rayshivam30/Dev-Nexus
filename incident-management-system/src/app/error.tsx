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
    <div className="min-h-screen bg-[#F0F0F0] text-black font-mono flex flex-col items-center justify-center p-6 selection:bg-black selection:text-white">
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      <div className="max-w-md w-full bg-white border-8 border-black p-8 shadow-[12px_12px_0_0_black] relative z-10">
        <div className="flex items-center space-x-3 mb-6 bg-[#FF00FF] px-4 py-2 border-[3px] border-black text-white w-max transform -rotate-2 shadow-[4px_4px_0_0_black]">
          <AlertTriangle className="w-8 h-8" />
          <h1 className="text-2xl font-black uppercase tracking-widest leading-none">SYS_FAIL</h1>
        </div>
        
        <p className="font-bold text-sm mb-2 uppercase tracking-widest opacity-60">RUNTIME EXCEPTION ENCOUNTERED</p>
        <div className="bg-black text-white p-4 font-mono text-xs overflow-auto max-h-32 mb-8 border-l-[6px] border-[#FFD700]">
          {error.message || "Unknown Application Error"}
        </div>

        <div className="flex flex-col space-y-4">
          <button
            onClick={() => reset()}
            className="flex items-center justify-center h-14 bg-[#FFD700] text-black border-[3px] border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            <RefreshCcw className="w-5 h-5 mr-3" />
            RESTART_SEQUENCE
          </button>
          <Link
            href="/"
            className="flex items-center justify-center h-14 bg-white text-black border-[3px] border-black font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[4px_4px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none"
          >
            <Home className="w-5 h-5 mr-3" />
            RETURN_TO_BASE
          </Link>
        </div>
      </div>
      <div className="mt-8 text-xs font-black uppercase tracking-widest text-black/40 z-10">DEVNEXUS_INCIDENT_SYSTEM</div>
    </div>
  );
}
