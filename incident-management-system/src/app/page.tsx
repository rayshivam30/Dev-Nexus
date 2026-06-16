"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import {
  ArrowRight,
  Command,
  Terminal,
  Github,
  Activity,
  Shield,
  Zap,
  Cpu,
  Clock,
  Sparkles,
  BarChart2
} from "lucide-react";
import Link from "next/link";
import { useRef, useEffect, useState } from "react";

/* ── Mouse-tracking spotlight ── */
function Spotlight() {
  const [pos, setPos] = useState({ x: -200, y: -200 });
  useEffect(() => {
    const handler = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);
  return (
    <div
      className="pointer-events-none fixed inset-0 z-[99] transition-opacity duration-500"
      style={{
        background: `radial-gradient(700px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.03), transparent 40%)`,
      }}
    />
  );
}

/* ── 3D tilt card ── */
function TiltCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), {
    stiffness: 300,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), {
    stiffness: 300,
    damping: 30,
  });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5 },
  }),
};

/* ── Mock data for Interactive Console ── */
const incidents = [
  {
    id: "INC-9482",
    title: "Auth Database Pool Exhaustion",
    severity: "CRITICAL",
    status: "Active",
    timeAgo: "2m ago",
    suggestedFix: "Increase max_connections connection pool limit from 20 to 50 in database adapter configuration.",
    metrics: { cpu: 89, memory: 94, latency: 1200 }
  },
  {
    id: "INC-9485",
    title: "ReferenceError: profile is not defined",
    severity: "HIGH",
    status: "Investigating",
    timeAgo: "1m ago",
    suggestedFix: "Wrap profile reading in null check conditional guard inside ProfileClient.tsx:L522.",
    metrics: { cpu: 45, memory: 72, latency: 320 }
  },
  {
    id: "INC-9488",
    title: "Gateway Timeout (504) on payment route",
    severity: "CRITICAL",
    status: "Active",
    timeAgo: "Just now",
    suggestedFix: "Service payment-auth-api is unresponsive. Triggering auto container reboot.",
    metrics: { cpu: 98, memory: 88, latency: 5000 }
  }
];

const baseLogs = [
  "[SYSTEM] Bootstrapping telemetry capture listeners...",
  "[INGEST] Webhook client successfully registered.",
  "[INFO] Connection pool established (min: 5, max: 20)",
  "[WARN] DB pool limit approached (85% active connections)",
  "[ERR] Database query queue threshold reached. Connection pool timeout."
];

interface TerminalConsoleProps {
  activeInc: typeof incidents[0];
}

/* ── Terminal log panel sub-component ── */
function TerminalConsole({ activeInc }: TerminalConsoleProps) {
  const [logs, setLogs] = useState<string[]>(baseLogs);

  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = `[MONITOR] Ingested ${activeInc.id} - Latency: ${activeInc.metrics.latency}ms, CPU: ${activeInc.metrics.cpu}%`;
      setLogs((prev) => [...prev.slice(-4), newLog]);
    }, 2000);
    return () => clearInterval(interval);
  }, [activeInc]);

  return (
    <div className="bg-[#050507] border border-white/[0.04] p-4 rounded-2xl font-mono text-[11px] text-zinc-500 space-y-1.5 max-h-[140px] overflow-hidden">
      <div className="flex justify-between items-center mb-1 text-[9px] font-bold text-zinc-600 tracking-wider uppercase">
        <span>Console Stream</span>
        <span className="flex items-center gap-1">
          <Terminal className="w-3 h-3" /> local_agent.log
        </span>
      </div>
      {logs.map((log, index) => {
        let color = "text-zinc-500";
        if (log.includes("[ERR]")) color = "text-red-400/80";
        if (log.includes("[WARN]")) color = "text-amber-400/80";
        if (log.includes("[MONITOR]")) color = "text-cyan-400/80";
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className={`truncate ${color}`}
          >
            {log}
          </motion.div>
        );
      })}
    </div>
  );
}

/* ── Interactive Console Telemetry mock ── */
function InteractiveConsole() {
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % incidents.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const activeInc = incidents[activeIdx];

  return (
    <div className="bg-[#0b0b0d]/70 border border-white/[0.08] backdrop-blur-2xl rounded-[32px] p-6 md:p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden relative group">
      {/* Background glow behind console */}
      <div className="absolute -top-[10%] -left-[10%] w-[300px] h-[300px] bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[300px] h-[300px] bg-violet-500/10 rounded-full blur-[80px] pointer-events-none" />

      {/* Header row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-white/[0.06] mb-6 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-zinc-400" /> DevNexus Active Telemetry
            </h3>
            <p className="text-xs text-white/30">Monitoring live organization nodes</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {incidents.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                idx === activeIdx ? "bg-white w-6" : "bg-white/20 hover:bg-white/40"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Left Column: Feeds */}
        <div className="space-y-3 bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30 mb-2">Live Incidents</h4>
          <div className="space-y-2">
            {incidents.map((inc, idx) => {
              const isActive = idx === activeIdx;
              return (
                <div
                  key={inc.id}
                  onClick={() => setActiveIdx(idx)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isActive
                      ? "bg-white/[0.04] border-white/[0.1] shadow-lg"
                      : "bg-transparent border-transparent opacity-50 hover:opacity-80"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] font-bold text-white/40 font-mono">{inc.id}</span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                      inc.severity === "CRITICAL" ? "bg-red-500/10 text-red-400" : "bg-orange-500/10 text-orange-400"
                    }`}>{inc.severity}</span>
                  </div>
                  <p className="text-xs font-semibold text-white/90 truncate">{inc.title}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Center Column: Live Metrics */}
        <div className="bg-white/[0.01] border border-white/[0.04] p-4 rounded-2xl space-y-4">
          <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/30">Node Telemetry</h4>
          
          <div className="space-y-3 pt-2">
            {/* CPU */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-white/60">
                <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" /> CPU Ingestion</span>
                <span>{activeInc.metrics.cpu}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-cyan-400" 
                  animate={{ width: `${activeInc.metrics.cpu}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Memory */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-white/60">
                <span className="flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> RAM Utilization</span>
                <span>{activeInc.metrics.memory}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-violet-400" 
                  animate={{ width: `${activeInc.metrics.memory}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Latency */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-medium text-white/60">
                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Response Delay</span>
                <span>{activeInc.metrics.latency}ms</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  className={`h-full ${activeInc.metrics.latency > 1000 ? "bg-red-400" : "bg-emerald-400"}`} 
                  animate={{ width: `${Math.min((activeInc.metrics.latency / 5000) * 100, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: AI Resolution */}
        <div className="bg-gradient-to-br from-violet-500/5 to-cyan-500/5 border border-white/[0.06] p-4 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-400">
            <Sparkles className="w-4 h-4 text-violet-400 animate-pulse" /> Gemini AI Resolution
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-white/30">Target Incident</p>
              <p className="text-xs font-bold text-white">{activeInc.id} · {activeInc.title}</p>
            </div>
            
            <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl">
              <p className="text-[10px] text-white/30 mb-1">Recommended Fix</p>
              <motion.p 
                key={activeInc.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-white/80 leading-relaxed font-mono"
              >
                {activeInc.suggestedFix}
              </motion.p>
            </div>
            
            <div className="flex gap-2">
              <div className="flex-1 py-2 rounded-lg bg-white/10 text-center text-[10px] font-bold text-white/80 border border-white/5">
                Investigate trace
              </div>
              <div className="flex-1 py-2 rounded-lg bg-white text-black text-center text-[10px] font-bold hover:bg-white/90 cursor-pointer">
                Auto-apply patch
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Terminal log panel */}
      <TerminalConsole key={activeIdx} activeInc={activeInc} />
    </div>
  );
}


export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white/20 relative overflow-hidden">
      <Spotlight />
      
      {/* Subtle premium grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.015)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:48px_48px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_30%,#000_40%,transparent_100%)] pointer-events-none" />

      {/* Background radial glow accents */}
      <div className="absolute top-[10%] left-[-10%] w-[600px] h-[600px] bg-violet-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-[35%] right-[-10%] w-[600px] h-[600px] bg-cyan-600/10 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/5 rounded-full blur-[160px] pointer-events-none" />

      {/* ── Nav ── */}
      <div className="fixed top-6 w-full z-[100] flex justify-center px-6">
        <nav className="flex items-center justify-between px-6 h-14 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full w-full max-w-5xl shadow-2xl">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Command className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-base tracking-tight">
                DevNexus
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-white/60 font-medium">
              {["Features", "Docs"].map((t) => (
                <Link
                  key={t}
                  href={t === "Docs" ? "/docs" : `#${t.toLowerCase()}`}
                  className="hover:text-white transition-colors duration-200"
                >
                  {t}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/auth/login"
              className="text-sm font-medium text-white/60 hover:text-white transition hidden sm:block"
            >
              Log in
            </Link>
            <Link
              href="/auth/register"
              className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]"
            >
              Sign Up
            </Link>
          </div>
        </nav>
      </div>

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-48 pb-32 px-6 overflow-hidden">
          <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold text-white/80 mb-8 shadow-xl"
            >
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> DevNexus 2.0 is
              now live
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.0] mb-8 text-white"
            >
              Ship fast. <br className="hidden md:block" />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">Stay resilient.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
            >
              The incident response platform for modern teams. Catch errors,
              analyze root causes with AI, and resolve issues before your users
              even notice.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <Link
                href="/auth/register"
                className="group h-14 px-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-base hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]"
              >
                Start for free{" "}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/docs"
                className="h-14 px-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-base hover:bg-white/10 transition-all text-white backdrop-blur-md"
              >
                Read the docs
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── TELEMETRY CONSOLE DEMO ── */}
        <section className="py-16 px-6 max-w-5xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <InteractiveConsole />
          </motion.div>
        </section>

        {/* ── SDK INTEGRATION ── */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={0}
                className="space-y-8"
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Developer
                  SDK
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.0]">
                  Integrate in
                  <br />
                  <span className="text-white/40">60 seconds.</span>
                </h2>
                <p className="text-lg text-white/60 leading-relaxed max-w-md font-medium">
                  Drop our TypeScript SDK into your codebase. No complex
                  configurations. We intercept errors at the source and route
                  them directly to your resolution dashboard.
                </p>
                <div className="flex items-center gap-6 pt-2">
                  {["TypeScript native", "Zero config", "Auto-capture"].map(
                    (t) => (
                      <div
                        key={t}
                        className="flex items-center gap-2 text-sm font-semibold text-white/50"
                      >
                        <div className="w-1.5 h-1.5 rounded-full bg-white/40" />{" "}
                        {t}
                      </div>
                    ),
                  )}
                </div>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={1}
              >
                <TiltCard className="perspective-[2000px]">
                  <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <span className="text-[10px] text-white/20 ml-3 font-mono">
                          app.ts
                        </span>
                      </div>
                      <span className="text-[10px] text-white/15 font-mono">
                        TypeScript
                      </span>
                    </div>
                    <div className="p-6 font-mono text-[13px] leading-7">
                      <div>
                        <span className="text-white/30">import</span>
                        {" { "}
                        <span className="text-white/80">DevNexus</span>
                        {" } "}
                        <span className="text-white/30">from</span>{" "}
                        <span className="text-white/50">
                          &apos;@devnexus/sdk&apos;
                        </span>
                        <span className="text-white/20">;</span>
                      </div>
                      <div className="text-white/15 mt-4">
                        {"// Initialize once"}
                      </div>
                      <div className="mt-1">
                        <span className="text-white/80">DevNexus</span>
                        <span className="text-white/20">.</span>
                        <span className="text-white/60">init</span>
                        <span className="text-white/20">({"{"}</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">apiKey</span>
                        <span className="text-white/15">:</span>{" "}
                        <span className="text-white/50">
                          &apos;dn_live_x28&apos;
                        </span>
                        <span className="text-white/15">,</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">autoCapture</span>
                        <span className="text-white/15">:</span>{" "}
                        <span className="text-white/70">true</span>
                        <span className="text-white/15">,</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">environment</span>
                        <span className="text-white/15">:</span>{" "}
                        <span className="text-white/50">
                          &apos;production&apos;
                        </span>
                      </div>
                      <div>
                        <span className="text-white/20">{"}"})</span>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="py-16 px-8 md:px-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "99.9%", label: "Uptime SLA" },
              { value: "<3min", label: "Mean Resolution" },
              { value: "2,400+", label: "Teams Active" },
              { value: "10M+", label: "Incidents Resolved" },
            ].map((s, i) => (
              <motion.div
                key={i}
                custom={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                className="text-center"
              >
                <div className="text-3xl md:text-4xl font-black tracking-tight">
                  {s.value}
                </div>
                <div className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.2em] font-medium">
                  {s.label}
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div>
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={0}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">
                Built for <span className="text-white/30">resilience.</span>
              </h2>
              <p className="text-white/50 text-xl max-w-2xl mx-auto font-medium">
                From detection to post-mortem, every stage of your incident
                lifecycle.
              </p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "AI Root Cause",
                  desc: "Gemini-powered engine analyzes stack traces and deployment history.",
                  icon: Zap,
                  glow: "hover:border-violet-500/30 hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]",
                  iconGlow: "text-violet-400"
                },
                {
                  title: "SLA Monitoring",
                  desc: "Track response and resolution SLAs with automated escalation.",
                  icon: Shield,
                  glow: "hover:border-cyan-500/30 hover:shadow-[0_0_30px_rgba(6,182,212,0.1)]",
                  iconGlow: "text-cyan-400"
                },
                {
                  title: "GitHub Sync",
                  desc: "Auto-create issues from incidents. Link commits to resolutions.",
                  icon: Github,
                  glow: "hover:border-white/20 hover:shadow-[0_0_30px_rgba(255,255,255,0.05)]",
                  iconGlow: "text-white/80"
                },
                {
                  title: "Real-time Alerts",
                  desc: "Push notifications and webhook events for every status change.",
                  icon: Activity,
                  glow: "hover:border-emerald-500/30 hover:shadow-[0_0_30px_rgba(16,185,129,0.1)]",
                  iconGlow: "text-emerald-400"
                },
                {
                  title: "Role-Based Access",
                  desc: "Admin, Manager, and Developer roles with scoped dashboards.",
                  icon: Shield,
                  glow: "hover:border-amber-500/30 hover:shadow-[0_0_30px_rgba(245,158,11,0.1)]",
                  iconGlow: "text-amber-400"
                },
                {
                  title: "SDK Ingestion",
                  desc: "Lightweight TypeScript SDK captures errors and custom metadata.",
                  icon: Terminal,
                  glow: "hover:border-rose-500/30 hover:shadow-[0_0_30px_rgba(244,63,94,0.1)]",
                  iconGlow: "text-rose-400"
                },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                >
                  <div className={`p-10 bg-[#0b0b0d]/40 backdrop-blur-md border border-white/[0.06] rounded-3xl transition-all duration-300 group h-full shadow-xl ${f.glow}`}>
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-all shadow-inner">
                      <f.icon className={`w-6 h-6 ${f.iconGlow}`} />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight text-white transition-colors">
                      {f.title}
                    </h3>
                    <p className="text-base text-white/50 leading-relaxed font-medium group-hover:text-white/70 transition-colors">
                      {f.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-40 px-6 text-center relative overflow-hidden mt-20">
          {/* Neon background glows behind CTA card */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-gradient-to-r from-violet-500/20 to-cyan-500/20 rounded-full blur-[120px] pointer-events-none" />
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="max-w-4xl mx-auto relative z-10 bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 rounded-[40px] p-16 backdrop-blur-2xl shadow-2xl"
          >
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.0]">
              Ready to regain
              <br />
              <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-emerald-400 bg-clip-text text-transparent">control?</span>
            </h2>
            <p className="text-white/60 text-xl font-medium mb-12 max-w-xl mx-auto">
              Install the SDK in 3 minutes. Let AI identify the root cause in
              seconds.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/register"
                className="group h-14 px-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-base hover:bg-white/90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
              >
                Create Account{" "}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </motion.div>
        </section>
      </main>

      {/* ── Footer ── */}
      <footer className="py-16 px-8 md:px-16 border-t border-white/[0.06]">
        <div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center">
                  <Command className="w-3.5 h-3.5 text-black" />
                </div>
                <span className="font-bold tracking-tight">DevNexus</span>
              </Link>
              <p className="text-[11px] text-white/15 max-w-[200px] leading-relaxed">
                Mission-critical incident infrastructure for modern engineering
                teams.
              </p>
            </div>
            {[
              {
                title: "Product",
                links: [
                  { name: "Features", href: "#features" },
                  { name: "Docs", href: "/docs" },
                ],
              },
              {
                title: "Legal",
                links: [
                  { name: "Privacy", href: "#" },
                  { name: "Terms", href: "#" },
                  { name: "Security", href: "#" },
                ],
              },
              {
                title: "Connect",
                links: [
                  { name: "Twitter", href: "#" },
                  { name: "GitHub", href: "#" },
                  { name: "Status", href: "#" },
                ],
              },
            ].map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">
                  {col.title}
                </h4>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <Link
                      key={link.name}
                      href={link.href}
                      className="text-xs text-white/25 hover:text-white transition-colors"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/10">
              &copy; 2026 DevNexus. All rights reserved.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span className="text-[10px] text-white/20">
                All systems operational
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
