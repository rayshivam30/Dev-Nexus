"use client";

import { ReactNode } from "react";
import Link from "next/link";
import { Command, ArrowLeft } from "lucide-react";

/* ── Animated grid pattern ── */
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern
            id="grid"
            width="40"
            height="40"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 40 0 L 0 0 0 40"
              fill="none"
              stroke="white"
              strokeWidth="0.5"
            />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}



export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen lg:h-screen lg:overflow-hidden flex relative bg-black text-white selection:bg-white/10 font-auth">
      <GridPattern />

      {/* ── Form panel (centered, full screen) ── */}
      <div className="flex-1 min-h-screen lg:h-screen flex flex-col relative overflow-hidden w-full">
        {/* Subtle gradient background with glowing radial accents for full panel */}
        <div className="fixed inset-0 bg-black pointer-events-none overflow-hidden">
          <div className="absolute top-[10%] left-[-10%] w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[140px]" />
          <div className="absolute bottom-[10%] right-[-10%] w-[500px] h-[500px] bg-cyan-600/10 rounded-full blur-[140px]" />
        </div>

        {/* Top nav */}
        <div className="relative z-10 flex items-center justify-between p-6 lg:px-10 flex-shrink-0">
          {/* Logo (shown on all screens now) */}
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-white flex items-center justify-center rounded-xl transition-all group-hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Command className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold tracking-tight text-lg">DevNexus</span>
          </Link>

          {/* Back button */}
          <Link
            href="/"
            className="text-xs font-bold text-white/40 hover:text-white px-4 py-2 transition-all flex items-center gap-2 border border-white/[0.08] rounded-full hover:bg-white/[0.05] hover:border-white/[0.15] ml-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* Form container */}
        <main className="relative z-10 flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-20 py-4 overflow-y-auto">
          <div className="w-full max-w-xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
