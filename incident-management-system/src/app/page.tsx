"use client";

import { motion } from "framer-motion";
import { ArrowRight, Database, ShieldCheck, Zap, Github, Terminal, Activity, CheckCircle2, Globe, Lock } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

const features = [
  { 
    icon: ShieldCheck, 
    title: "SLA Guardrails", 
    description: "Hard-coded response and resolution windows. Automated escalation triggers ensure no incident is left stranded." 
  },
  { 
    icon: Zap, 
    title: "Predictive Root Cause", 
    description: "Our heuristics engine maps incoming errors to specific Git commits, identifies regressions, and points to the likely fix." 
  },
  { 
    icon: Database, 
    title: "Native Ingestion", 
    description: "Native SDKs and GitHub webhooks capture state, environment variables, and stack traces the microsecond a failure occurs." 
  }
];

const stats = [
  { label: "Uptime", value: "99.99%" },
  { label: "Incidents Resolved", value: "12M+" },
  { label: "Avg. Resolution", value: "14m" }
];

const pricing = [
  { 
    name: "Basic", 
    price: "$0", 
    description: "Perfect for indie developers and small startups.",
    features: ["5 Projects", "Priority & Env Fields", "Basic Activity Log", "Root Cause Capture", "GitHub URL required"]
  },
  { 
    name: "Advanced", 
    price: "$29", 
    description: "Designed for scaling engineering teams.",
    features: ["Everything in Basic", "SLA Monitoring", "Advanced Analytics", "Team Management", "Custom SDK Integration"],
    popular: true
  },
  { 
    name: "Pro", 
    price: "Custom", 
    description: "Enterprise-grade security and reliability.",
    features: ["Everything in Advanced", "SSO/SAML Authentication", "Multi-region Deployments", "Dedicated Support", "Coming Soon"],
    comingSoon: true
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#020408] text-[#FAFAFA] font-sans selection:bg-violet-500/30">
      
      {/* Dynamic Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[60%] bg-violet-900/10 blur-[160px] rounded-full rotate-12" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-indigo-900/10 blur-[160px] rounded-full -rotate-12" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] contrast-150 brightness-150" />
      </div>

      {/* Glass Navbar */}
      <header className="fixed top-0 w-full border-b border-white/[0.08] bg-black/60 backdrop-blur-xl z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3 group">
          <div className="w-6 h-6 bg-gradient-to-tr from-violet-600 to-indigo-600 rounded-md flex items-center justify-center shadow-lg shadow-violet-500/20 group-hover:scale-110 transition-transform">
            <Activity className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold tracking-tight text-xl bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">DevNexus.</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-white/50">
          <Link href="#features" className="hover:text-white transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
          <Link href="/docs" className="hover:text-white transition-colors">Docs</Link>
        </nav>
        <div className="flex items-center space-x-6">
          <Link href="/auth/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">Sign In</Link>
          <Link 
            href="/auth/register" 
            className="text-sm font-semibold bg-white text-black px-5 py-2 rounded-full hover:bg-white/90 active:scale-95 transition-all shadow-xl shadow-white/5"
          >
            Get Started
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center pt-48 pb-32 px-6 text-center max-w-7xl mx-auto overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center border border-white/10 bg-white/[0.03] backdrop-blur-md rounded-full px-4 py-1.5 mb-12 text-[10px] font-mono uppercase tracking-[0.2em] text-white/50"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-3 animate-pulse shadow-[0_0_8px_#10b981]" />
            v0.1.0 Stable Distribution
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-6xl md:text-8xl lg:text-9xl font-[900] tracking-tighter leading-[0.8] max-w-5xl"
          >
            Engineered for <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-indigo-400">Total Uptime.</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 text-lg md:text-xl text-white/40 max-w-2xl font-medium leading-relaxed"
          >
            DevNexus is a mission-critical incident infrastructure for teams that can't afford a second of downtime. Lightweight SDK. Heavyweight resolution.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-5 mt-14"
          >
            <Link href="/dashboard" className="group relative flex items-center justify-center h-14 px-10 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 active:scale-[0.98] transition-all overflow-hidden shadow-2xl shadow-violet-600/20">
                Launch Dashboard <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link href="/docs" className="flex items-center justify-center h-14 px-10 rounded-xl border border-white/10 bg-white/[0.03] backdrop-blur-md font-semibold hover:bg-white/10 transition-colors gap-2">
               <Terminal className="w-4 h-4 text-violet-400" /> Read Docs
            </Link>
          </motion.div>
        </section>

        {/* Code Snippet Section */}
        <section className="py-32 px-6 max-w-6xl mx-auto border-t border-white/[0.05]">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-6">
                    <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                        Integrate in <br /> 
                        <span className="text-white/40">under 60 seconds.</span>
                    </h2>
                    <p className="text-white/40 text-lg leading-relaxed">
                        Drop our TypeScript SDK into your codebase. No complex configurations, no manual reporting. We intercept errors at the source and route them directly to your resolution dashboard.
                    </p>
                    <ul className="space-y-4 pt-4">
                        {[
                            "Native ESM & CommonJS support",
                            "Universal Node.js & Browser compatibility",
                            "Automatic Git context resolution",
                            "Zero performance overhead"
                        ].map(t => (
                            <li key={t} className="flex items-center text-sm font-semibold text-white/70">
                                <CheckCircle2 className="w-5 h-5 mr-3 text-violet-500" />
                                {t}
                            </li>
                        ))}
                    </ul>
                </div>
                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    className="relative"
                >
                    <div className="absolute -inset-4 bg-violet-600/10 blur-3xl opacity-50 rounded-full" />
                    <div className="relative border border-white/10 rounded-2xl bg-[#0a0a0a] shadow-2xl overflow-hidden font-mono text-sm leading-relaxed">
                        <div className="bg-white/5 px-4 py-3 border-b border-white/10 flex items-center justify-between">
                            <div className="flex space-x-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                            </div>
                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">src/lib/devnexus.ts</span>
                        </div>
                        <div className="p-6 space-y-1 text-white/90">
                            <p><span className="text-violet-400">import</span> &#123; DevNexus &#125; <span className="text-violet-400">from</span> <span className="text-emerald-400">'@devnexus/sdk'</span>;</p>
                            <p className="opacity-0">.</p>
                            <p><span className="text-white/40">// Initialize once</span></p>
                            <p><span className="text-violet-400">DevNexus</span>.<span className="text-blue-400 font-bold">init</span>(&#123;</p>
                            <p className="ml-4">apiKey: <span className="text-emerald-400">'dn_live_...x28'</span>,</p>
                            <p className="ml-4">autoCapture: <span className="text-blue-400">true</span>,</p>
                            <p className="ml-4">environment: <span className="text-emerald-400">'production'</span></p>
                            <p>&#125;);</p>
                            <p className="opacity-0">.</p>
                            <p><span className="text-white/40">// That's it. We handle the rest.</span></p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </section>





  
        {/* Pricing Section */}
        <section id="pricing" className="py-32 px-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[300px] bg-indigo-600/10 blur-[150px] opacity-30 pointer-events-none rounded-full" />
          <div className="max-w-7xl mx-auto relative z-10">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold">Simple, transparent pricing.</h2>
              <p className="text-white/40 max-w-xl mx-auto">Choose the plan that fits your current needs and scale when you're ready.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {pricing.map((plan, i) => (
                <motion.div 
                  key={plan.name}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className={cn(
                    "relative p-8 rounded-[32px] border bg-black transition-all hover:scale-[1.02]",
                    plan.popular ? "border-violet-500/50 shadow-2xl shadow-violet-500/10 scale-105 z-20" : "border-white/10",
                    plan.comingSoon && "opacity-80"
                  )}
                >
                  {plan.popular && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-violet-600 text-[10px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </div>
                  )}
                  <div className="mb-8">
                    <h3 className="text-lg font-medium text-white/60 mb-2">{plan.name}</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-black">{plan.price}</span>
                        {plan.price !== "Custom" && <span className="text-sm text-white/40">/month</span>}
                    </div>
                    <p className="mt-4 text-sm text-white/40 leading-relaxed">{plan.description}</p>
                  </div>
                  <ul className="space-y-4 mb-10">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center text-sm text-white/70">
                        <CheckCircle2 className="w-4 h-4 mr-3 text-violet-500 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link 
                    href={plan.comingSoon ? "#" : "/auth/register"}
                    className={cn(
                        "flex items-center justify-center w-full py-4 rounded-2xl font-bold transition-all",
                        plan.popular 
                            ? "bg-violet-600 text-white hover:bg-violet-500 shadow-xl shadow-violet-600/20" 
                            : "bg-white/5 text-white hover:bg-white/10 border border-white/10"
                    )}
                  >
                    {plan.comingSoon ? "Coming Soon" : "Get Started"}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-40 px-6 max-w-5xl mx-auto text-center">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                className="p-16 rounded-[48px] border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-violet-600/20 blur-[100px] rounded-full -mr-32 -mt-32" />
                <div className="relative z-10">
                    <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to regain control?</h2>
                    <p className="text-white/50 text-lg mb-12 max-w-lg mx-auto italic font-medium">
                        Install the SDK in 3 minutes. Fix incidents in seconds.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link href="/auth/register" className="h-14 px-10 flex items-center justify-center bg-white text-black font-bold rounded-full hover:scale-105 transition-all">
                            Create Account
                        </Link>
                        <Link href="/docs" className="h-14 px-10 flex items-center justify-center border border-white/10 bg-white/5 font-bold rounded-full hover:bg-white/10 transition-all gap-2">
                            <Terminal className="w-4 h-4" /> View Docs
                        </Link>
                    </div>
                </div>
            </motion.div>
        </section>
      </main>

      {/* Modern Footer */}
      <footer className="border-t border-white/[0.05] py-20 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-12">
            <div className="flex items-center space-x-3 opacity-50 grayscale">
                <div className="w-5 h-5 bg-white rounded-sm" />
                <span className="font-black tracking-widest text-sm uppercase">DevNexus.</span>
            </div>
            <div className="flex items-center space-x-12 text-xs font-mono uppercase tracking-[0.2em] text-white/30">
                <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
                <Link href="#" className="hover:text-white transition-colors">Twitter</Link>
                <Link href="#" className="hover:text-white transition-colors">GitHub</Link>
                <Link href="#" className="hover:text-white transition-colors">Status</Link>
            </div>
            <div className="text-[10px] text-white/20 font-mono italic">
                &copy; {new Date().getFullYear()} Resilient Systems Corp.
            </div>
        </div>
      </footer>
    </div>
  );
}

