"use client";

import { ReactNode, useEffect, useState } from "react";
import Link from "next/link";
import { Command, ArrowLeft, Shield, Activity, Zap, Lock } from "lucide-react";
import { motion } from "framer-motion";



/* ── Animated grid pattern ── */
function GridPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.03]">
      <svg width="100%" height="100%">
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />
      </svg>
    </div>
  );
}

/* ── Rotating feature highlights ── */
const features = [
  { icon: Shield, title: "Enterprise Security", desc: "SOC 2 compliant with end-to-end encryption" },
  { icon: Activity, title: "Real-time Monitoring", desc: "Track incidents as they happen, not after" },
  { icon: Zap, title: "AI Root Cause", desc: "Gemini-powered analysis identifies issues instantly" },
  { icon: Lock, title: "Role-based Access", desc: "Fine-grained permissions for every team member" },
];

function FeatureShowcase() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % features.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      {features.map((feature, i) => {
        const isActive = i === activeIndex;
        const Icon = feature.icon;
        return (
          <motion.div
            key={i}
            className={`flex items-start gap-4 p-3.5 rounded-2xl transition-all duration-500 ${
              isActive
                ? "bg-white/[0.08] border border-white/[0.12]"
                : "border border-transparent opacity-40"
            }`}
            animate={{ opacity: isActive ? 1 : 0.35 }}
            transition={{ duration: 0.5 }}
          >
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-500 ${
                isActive
                  ? "bg-white/10 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
                  : "bg-white/5"
              }`}
            >
              <Icon className={`w-4 h-4 transition-colors duration-500 ${isActive ? "text-white" : "text-white/40"}`} />
            </div>
            <div>
              <h4 className="text-sm font-bold tracking-tight">{feature.title}</h4>
              <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{feature.desc}</p>
            </div>
          </motion.div>
        );
      })}
      {/* Progress dots */}
      <div className="flex items-center gap-2 px-4 pt-1">
        {features.map((_, i) => (
          <motion.div
            key={i}
            className="h-1 rounded-full"
            animate={{
              width: i === activeIndex ? 24 : 8,
              backgroundColor: i === activeIndex ? "rgba(255,255,255,0.6)" : "rgba(255,255,255,0.15)",
            }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        ))}
      </div>
    </div>
  );
}

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex relative bg-black text-white selection:bg-white/10">

      {/* ── Left brand panel (hidden on mobile, fixed on desktop) ── */}
      <div className="hidden lg:flex w-[45%] fixed inset-y-0 left-0 flex-col p-8 overflow-hidden">

        <GridPattern />

        {/* Top — Logo */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="relative z-10 flex-shrink-0"
        >
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 bg-white flex items-center justify-center rounded-xl transition-all group-hover:scale-110 shadow-[0_0_20px_rgba(255,255,255,0.15)]">
              <Command className="w-4 h-4 text-black" />
            </div>
            <span className="font-bold tracking-tight text-lg">DevNexus</span>
          </Link>
        </motion.div>

        {/* Center — Feature showcase */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="relative z-10 flex-1 flex flex-col justify-center py-8 min-h-0"
        >
          <div className="space-y-3 mb-6">
            <h2 className="text-2xl xl:text-3xl font-black tracking-tighter leading-tight">
              Incident response,{" "}
              <span className="text-white/40">
                reimagined.
              </span>
            </h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-sm font-medium">
              Join thousands of engineering teams who resolve incidents faster with AI-powered root cause analysis.
            </p>
          </div>
          <FeatureShowcase />
        </motion.div>
      </div>

      {/* ── Vertical Divider Line with glowing animated beam ── */}
      <div className="hidden lg:block fixed left-[45%] inset-y-0 w-[1px] z-20 pointer-events-none">
        {/* The line itself with a fade-in-out gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/[0.12] to-transparent" />
        
        {/* Animated glowing beam that flows down the line */}
        <motion.div
          className="absolute left-1/2 -translate-x-1/2 w-[2px] h-[100px] bg-gradient-to-b from-transparent via-white/40 to-transparent rounded-full"
          animate={{
            y: ["-10vh", "110vh"],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 lg:ml-[45%] min-h-screen flex flex-col relative">
        {/* Subtle gradient background for right panel */}
        <div className="fixed lg:left-[45%] inset-y-0 right-0 bg-black pointer-events-none" />

        {/* Top nav */}
        <div className="relative z-10 flex items-center justify-between p-6 lg:px-10 flex-shrink-0">
          {/* Mobile logo */}
          <Link href="/" className="flex items-center space-x-2 group lg:hidden">
            <div className="w-8 h-8 bg-white flex items-center justify-center rounded-xl transition-all group-hover:scale-110">
              <Command className="w-3.5 h-3.5 text-black" />
            </div>
            <span className="font-bold tracking-tight text-base">DevNexus</span>
          </Link>

          {/* Back button */}
          <Link
            href="/"
            className="text-xs font-bold text-white/40 hover:text-white px-4 py-2 transition-all flex items-center gap-2 border border-white/[0.08] rounded-full hover:bg-white/[0.05] hover:border-white/[0.15] ml-auto"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </Link>
        </div>

        {/* Form container — scrollable */}
        <main className="relative z-10 flex-1 flex flex-col justify-center px-6 lg:px-12 xl:px-20 py-4">
          <div className="w-full max-w-md mx-auto lg:mx-0">
            {children}
          </div>
        </main>

    
      </div>
    </div>
  );
}
