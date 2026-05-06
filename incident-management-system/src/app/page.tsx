"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ArrowRight, Command, Terminal, Github, Activity, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
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
      style={{ background: `radial-gradient(700px circle at ${pos.x}px ${pos.y}px, rgba(255,255,255,0.03), transparent 40%)` }}
    />
  );
}

/* ── 3D tilt card ── */
function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [4, -4]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-4, 4]), { stiffness: 300, damping: 30 });

  return (
    <motion.div
      ref={ref}
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - rect.left) / rect.width - 0.5);
        y.set((e.clientY - rect.top) / rect.height - 0.5);
      }}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5 } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-black text-white font-sans antialiased selection:bg-white/20">
      <Spotlight />

      {/* ── Nav ── */}
      <div className="fixed top-6 w-full z-[100] flex justify-center px-6">
        <nav className="flex items-center justify-between px-6 h-14 bg-white/5 border border-white/10 backdrop-blur-2xl rounded-full w-full max-w-5xl shadow-2xl">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-7 h-7 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                <Command className="w-3.5 h-3.5 text-black" />
              </div>
              <span className="font-bold text-base tracking-tight">DevNexus</span>
            </Link>
            <div className="hidden md:flex items-center gap-6 text-sm text-white/60 font-medium">
              {["Features", "Pricing", "Docs"].map((t) => (
                <Link key={t} href={t === "Docs" ? "/docs" : `#${t.toLowerCase()}`} className="hover:text-white transition-colors duration-200">{t}</Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/auth/login" className="text-sm font-medium text-white/60 hover:text-white transition hidden sm:block">Log in</Link>
            <Link href="/auth/register" className="bg-white text-black px-5 py-2 rounded-full text-sm font-bold hover:bg-white/90 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]">
              Sign Up
            </Link>
          </div>
        </nav>
      </div>

      <main>
        {/* ── HERO ── */}
        <section className="relative pt-48 pb-32 px-6 overflow-hidden">
          
          <div className="max-w-4xl mx-auto text-center relative z-10 flex flex-col items-center">
            <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 backdrop-blur-md text-xs font-semibold text-white/80 mb-8 shadow-xl">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> DevNexus 2.0 is now live
            </motion.div>

            <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.0] mb-8"
            >
              Ship fast. <br className="hidden md:block" />
              <span className="text-white/40">Stay resilient.</span>
            </motion.h1>

            <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="text-lg md:text-xl text-white/60 max-w-2xl mx-auto mb-12 leading-relaxed font-medium"
            >
              The incident response platform for modern teams. Catch errors, analyze root causes with AI, and resolve issues before your users even notice.
            </motion.p>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="group h-14 px-8 bg-white text-black rounded-full flex items-center justify-center font-bold text-base hover:bg-white/90 transition-all shadow-[0_0_40px_rgba(255,255,255,0.2)]">
                Start for free <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="h-14 px-8 bg-white/5 border border-white/10 rounded-full flex items-center justify-center font-bold text-base hover:bg-white/10 transition-all text-white backdrop-blur-md">
                Read the docs
              </Link>
            </motion.div>
          </div>
        </section>

        {/* ── SDK INTEGRATION ── */}
        <section id="features" className="py-32 px-6 max-w-7xl mx-auto">
          <div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="space-y-8">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 border border-white/10 bg-white/5 backdrop-blur-md rounded-full text-xs font-bold text-white shadow-lg">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Developer SDK
                </div>
                <h2 className="text-5xl md:text-6xl font-black tracking-tighter leading-[1.0]">
                  Integrate in<br />
                  <span className="text-white/40">60 seconds.</span>
                </h2>
                <p className="text-lg text-white/60 leading-relaxed max-w-md font-medium">
                  Drop our TypeScript SDK into your codebase. No complex configurations. We intercept errors at the source and route them directly to your resolution dashboard.
                </p>
                <div className="flex items-center gap-6 pt-2">
                  {["TypeScript native", "Zero config", "Auto-capture"].map((t) => (
                    <div key={t} className="flex items-center gap-2 text-sm font-semibold text-white/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-white/40" /> {t}
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={1}>
                <TiltCard className="perspective-[2000px]">
                  <div className="bg-[#0a0a0a]/80 backdrop-blur-3xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative">

                    <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06]">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                          <div className="w-2.5 h-2.5 rounded-full bg-white/10" />
                        </div>
                        <span className="text-[10px] text-white/20 ml-3 font-mono">app.ts</span>
                      </div>
                      <span className="text-[10px] text-white/15 font-mono">TypeScript</span>
                    </div>
                    <div className="p-6 font-mono text-[13px] leading-7">
                      <div>
                        <span className="text-white/30">import</span>
                        {" { "}
                        <span className="text-white/80">DevNexus</span>
                        {" } "}
                        <span className="text-white/30">from</span>
                        {" "}
                        <span className="text-white/50">&apos;@devnexus/sdk&apos;</span>
                        <span className="text-white/20">;</span>
                      </div>
                      <div className="text-white/15 mt-4">{"// Initialize once"}</div>
                      <div className="mt-1">
                        <span className="text-white/80">DevNexus</span>
                        <span className="text-white/20">.</span>
                        <span className="text-white/60">init</span>
                        <span className="text-white/20">({"{"}</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">apiKey</span>
                        <span className="text-white/15">:</span>
                        {" "}
                        <span className="text-white/50">&apos;dn_live_x28&apos;</span>
                        <span className="text-white/15">,</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">autoCapture</span>
                        <span className="text-white/15">:</span>
                        {" "}
                        <span className="text-white/70">true</span>
                        <span className="text-white/15">,</span>
                      </div>
                      <div className="pl-6">
                        <span className="text-white/40">environment</span>
                        <span className="text-white/15">:</span>
                        {" "}
                        <span className="text-white/50">&apos;production&apos;</span>
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
              <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
                <div className="text-3xl md:text-4xl font-black tracking-tight">{s.value}</div>
                <div className="text-[10px] text-white/20 mt-1 uppercase tracking-[0.2em] font-medium">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* ── FEATURES ── */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
          <div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">
                Built for <span className="text-white/30">resilience.</span>
              </h2>
              <p className="text-white/50 text-xl max-w-2xl mx-auto font-medium">From detection to post-mortem, every stage of your incident lifecycle.</p>
            </motion.div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: "AI Root Cause", desc: "Gemini-powered engine analyzes stack traces and deployment history.", icon: Zap },
                { title: "SLA Monitoring", desc: "Track response and resolution SLAs with automated escalation.", icon: Shield },
                { title: "GitHub Sync", desc: "Auto-create issues from incidents. Link commits to resolutions.", icon: Github },
                { title: "Real-time Alerts", desc: "Push notifications and webhook events for every status change.", icon: Activity },
                { title: "Role-Based Access", desc: "Admin, Manager, and Developer roles with scoped dashboards.", icon: Shield },
                { title: "SDK Ingestion", desc: "Lightweight TypeScript SDK captures errors and custom metadata.", icon: Terminal },
              ].map((f, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <div className="p-10 bg-white/[0.02] border border-white/[0.06] rounded-3xl hover:bg-white/[0.04] hover:border-white/[0.1] transition-all duration-300 group h-full shadow-xl">
                    <div className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-white/10 transition-all shadow-inner">
                      <f.icon className="w-6 h-6 text-white/80" />
                    </div>
                    <h3 className="text-xl font-bold mb-3 tracking-tight">{f.title}</h3>
                    <p className="text-base text-white/50 leading-relaxed font-medium">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── PRICING ── */}
        <section id="pricing" className="py-32 px-6 max-w-7xl mx-auto relative">
          
          <div className="relative z-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="text-center mb-20">
              <h2 className="text-5xl md:text-6xl font-black tracking-tighter mb-6">Simple pricing.</h2>
              <p className="text-white/50 text-xl font-medium">Choose the plan that fits. Scale when ready.</p>
            </motion.div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {[
                { name: "BASIC", subtitle: "For indie developers", price: "Free", feats: ["5 Projects", "Priority Fields", "Activity Log", "GitHub Integration"] },
                { name: "ADVANCED", subtitle: "For scaling teams", price: "$12", per: "/user/mo", popular: true, feats: ["Everything in Basic", "SLA Monitoring", "Advanced Analytics", "Team Management"] },
                { name: "PRO", subtitle: "Enterprise-grade", price: "$29", per: "/user/mo", feats: ["Everything in Advanced", "SSO / SAML", "Multi-region", "Dedicated Support"] },
              ].map((tier, i) => (
                <motion.div key={i} custom={i} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
                  <TiltCard className="h-full perspective-[1500px]">
                    <div className={cn(
                      "h-full p-10 rounded-[32px] border flex flex-col transition-all relative shadow-2xl backdrop-blur-xl",
                      tier.popular
                        ? "bg-white text-black border-white shadow-[0_20px_60px_-15px_rgba(255,255,255,0.2)]" 
                        : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04]"
                    )}>
                      {tier.popular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-5 py-1.5 bg-white text-black rounded-full text-xs font-bold shadow-lg">
                          Recommended
                        </div>
                      )}
                      <div className="mb-8">
                        <div className={cn("text-xs font-bold uppercase tracking-widest mb-4", tier.popular ? "text-black/50" : "text-white/40")}>{tier.name}</div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-5xl font-black tracking-tighter">{tier.price}</span>
                          {tier.per && <span className={cn("text-base font-semibold", tier.popular ? "text-black/40" : "text-white/40")}>{tier.per}</span>}
                        </div>
                        <p className={cn("text-base font-medium mt-3", tier.popular ? "text-black/60" : "text-white/50")}>{tier.subtitle}</p>
                      </div>
                      <ul className="space-y-4 mb-10 flex-1">
                        {tier.feats.map((f) => (
                          <li key={f} className={cn("flex items-center gap-4 text-base font-medium", tier.popular ? "text-black/70" : "text-white/70")}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", tier.popular ? "bg-black/40" : "bg-white/40")} /> {f}
                          </li>
                        ))}
                      </ul>
                      <Link href="/auth/register" className={cn(
                        "w-full py-4 rounded-full font-bold text-base text-center transition-all block",
                        tier.popular 
                          ? "bg-black text-white hover:bg-black/90 shadow-xl" 
                          : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                      )}>
                        Get Started
                      </Link>
                    </div>
                  </TiltCard>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="py-40 px-6 text-center relative overflow-hidden mt-20">
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={0} className="max-w-4xl mx-auto relative z-10 bg-white/[0.02] border border-white/10 rounded-[40px] p-16 backdrop-blur-2xl shadow-2xl">
            <h2 className="text-6xl md:text-7xl font-black tracking-tighter mb-8 leading-[1.0]">
              Ready to regain<br />control?
            </h2>
            <p className="text-white/60 text-xl font-medium mb-12 max-w-xl mx-auto">Install the SDK in 3 minutes. Let AI identify the root cause in seconds.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register" className="group h-14 px-10 bg-white text-black rounded-full flex items-center justify-center font-bold text-base hover:bg-white/90 transition-all shadow-xl">
                Create Account <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
                <div className="w-7 h-7 bg-white rounded-md flex items-center justify-center"><Command className="w-3.5 h-3.5 text-black" /></div>
                <span className="font-bold tracking-tight">DevNexus</span>
              </Link>
              <p className="text-[11px] text-white/15 max-w-[200px] leading-relaxed">Mission-critical incident infrastructure for modern engineering teams.</p>
            </div>
            {[
              { title: "Product", links: [{ name: "Features", href: "#features" }, { name: "Pricing", href: "#pricing" }, { name: "Docs", href: "/docs" }] },
              { title: "Legal", links: [{ name: "Privacy", href: "#" }, { name: "Terms", href: "#" }, { name: "Security", href: "#" }] },
              { title: "Connect", links: [{ name: "Twitter", href: "#" }, { name: "GitHub", href: "#" }, { name: "Status", href: "#" }] },
            ].map((col) => (
              <div key={col.title} className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/20">{col.title}</h4>
                <div className="flex flex-col gap-3">
                  {col.links.map((link) => (
                    <Link key={link.name} href={link.href} className="text-xs text-white/25 hover:text-white transition-colors">{link.name}</Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="mt-12 pt-8 border-t border-white/[0.06] flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-[10px] text-white/10">&copy; 2026 DevNexus. All rights reserved.</p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
              <span className="text-[10px] text-white/20">All systems operational</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
