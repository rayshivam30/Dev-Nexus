"use client";

import { motion } from "framer-motion";
import { ArrowRight, Terminal, Activity, CheckCircle2, Shield, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const pricing = [
  { 
    name: "FREE", 
    price: "$0", 
    description: "For indie hackers & tiny experiments.",
    features: ["5 active projects", "Standard priority fields", "Root cause tags", "GitHub integration"],
    color: "bg-white"
  },
  { 
    name: "PRO", 
    price: "$29", 
    description: "Built for scaling dev teams.",
    features: ["Everything in Free", "SLA Monitoring", "Analytics Suite", "Team Management"],
    popular: true,
    color: "bg-[#FFD700]" 
  },
  { 
    name: "BIZ", 
    price: "ASK", 
    description: "For the big league players.",
    features: ["Everything in Pro", "SSO/SAML", "Multi-region", "Dedicated support"],
    color: "bg-[#00D1FF]" 
  }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F0F0F0] text-black font-mono selection:bg-black selection:text-white">
      
      {/* Brutalist Grid Background */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] z-0" 
           style={{ backgroundImage: `radial-gradient(#000 1px, transparent 0)`, backgroundSize: '24px 24px' }}>
      </div>

      {/* Chunky Navbar */}
      <header className="sticky top-0 w-full z-50 bg-[#FFD700] border-b-[4px] border-black flex items-center justify-between px-6 md:px-12 h-20 shadow-[0_4px_0_0_rgba(0,0,0,1)]">
        <div className="flex items-center space-x-3 transform -rotate-1">
          <div className="w-10 h-10 bg-black flex items-center justify-center border-2 border-black shadow-[4px_4px_0_0_white]">
            <Activity className="w-6 h-6 text-[#FFD700]" />
          </div>
          <span className="font-black text-2xl tracking-tighter uppercase italic">DevNexus_</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 font-black uppercase text-sm">
          <Link href="#features" className="hover:line-through decoration-4 underline-offset-4 decoration-black">Features</Link>
          <Link href="#pricing" className="hover:line-through decoration-4 underline-offset-4 decoration-black">Pricing</Link>
          <Link href="/docs" className="hover:line-through decoration-4 underline-offset-4 decoration-black">API</Link>
        </nav>

        <div className="flex items-center space-x-4">
          <Link href="/auth/login" className="hidden sm:block font-black uppercase text-sm hover:underline underline-offset-4">Sign_In</Link>
          <Link 
            href="/auth/register" 
            className="bg-black text-white px-6 py-3 border-[3px] border-black hover:bg-white hover:text-black transition-colors font-black uppercase text-sm shadow-[4px_4px_0_0_#00D1FF]"
          >
            Join_Now
          </Link>
        </div>
      </header>

      <main className="relative z-10">
        
        {/* HERO SECTION */}
        <section className="flex flex-col items-center justify-center pt-32 pb-40 px-6 text-center max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="inline-block bg-white border-[3px] border-black px-4 py-2 mb-12 text-xs font-black uppercase tracking-wider transform rotate-1 shadow-[4px_4px_0_0_#FF00FF]"
          >
            ! STATUS: CRITICAL_ALPHA
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-7xl md:text-9xl font-black tracking-tighter leading-[0.85] uppercase mb-12"
          >
            ZERO <br />
            <span className="bg-[#FFD700] border-4 border-black px-4 shadow-[8px_8px_0_0_black]">DOWNTIME_</span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 text-xl md:text-2xl text-black font-black max-w-3xl border-l-[8px] border-black pl-6 py-4 bg-white shadow-[6px_6px_0_0_black]"
          >
            Mission-critical incident infrastructure for teams that write code, break things, and fix them—fast. 
            <span className="block mt-2 italic text-sm opacity-60 font-medium">{"// Don't let bugs win. Join the nexus."}</span>
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-6 mt-16"
          >
            <Link href="/dashboard" className="h-20 px-12 bg-black text-white flex items-center justify-center font-black text-xl uppercase border-4 border-black shadow-[8px_8px_0_0_#FFD700] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                The_Dashboard <ArrowRight className="ml-4 w-6 h-6" />
            </Link>
            <Link href="/docs" className="h-20 px-12 bg-white text-black flex items-center justify-center font-black text-xl uppercase border-4 border-black shadow-[8px_8px_0_0_black] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all">
                READ.ME
            </Link>
          </motion.div>
        </section>

        {/* FEATURE GRID */}
        <section id="features" className="py-32 border-y-[4px] border-black bg-white">
          <div className="max-w-7xl mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-0 border-t-[4px] border-l-[4px] border-black">
              {[
                { title: "Universal_SDK", desc: "One line of code. Infinite observability.", icon: Zap, color: "bg-[#FF00FF]" },
                { title: "Auto_Context", desc: "Git tags, env vars, and stack traces mapped.", icon: Terminal, color: "bg-[#00D1FF]" },
                { title: "Team_Focus", desc: "Collaborate on resolutions in real-time.", icon: Shield, color: "bg-[#FFD700]" },
                { title: "No_Bullshit", desc: "Pure logs. No marketing fluff. Just data.", icon: Activity, color: "bg-white" }
              ].map((feat, i) => (
                <div key={i} className="p-10 border-r-[4px] border-b-[4px] border-black hover:bg-[#F0F0F0] transition-colors group">
                  <div className={cn("w-12 h-12 border-[3px] border-black flex items-center justify-center mb-8 shadow-[4px_4px_0_0_black] group-hover:scale-110 transition-transform", feat.color)}>
                    <feat.icon className="w-6 h-6 text-black" />
                  </div>
                  <h3 className="text-2xl font-black mb-4 uppercase tracking-tighter">{feat.title}</h3>
                  <p className="font-bold text-sm leading-relaxed opacity-70 cursor-help">{feat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CODE PREVIEW SECTION */}
        <section className="py-32 px-6 max-w-7xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
                <div className="space-y-10">
                    <h2 className="text-5xl md:text-7xl font-black uppercase leading-none tracking-tighter">
                        Install_In <br /> 
                        <span className="bg-[#00D1FF] border-[3px] border-black px-2 shadow-[6px_6px_0_0_black]">60_SECONDS</span>
                    </h2>
                    <p className="text-xl font-bold leading-relaxed max-w-lg border-l-4 border-black pl-6">
                        Drop our TypeScript SDK into your repo. We intercept errors at the binary level and stream them to your command center.
                    </p>
                    <div className="flex flex-col space-y-4">
                        {["ESM Supported", "Zero Overhead", "Automatic Resolution"].map(item => (
                            <div key={item} className="flex items-center font-black uppercase text-lg border-b-2 border-black pb-2 w-fit">
                                <CheckCircle2 className="w-6 h-6 mr-4 text-black" />
                                {item}
                            </div>
                        ))}
                    </div>
                </div>
                
                <div className="bg-black border-[6px] border-black shadow-[16px_16px_0_0_#FFD700] p-1 pt-0">
                    <div className="h-10 bg-[#FFD700] border-b-[6px] border-black flex items-center px-4 justify-between">
                        <span className="font-black text-xs uppercase tracking-widest text-black">Terminal // nexus_init</span>
                        <div className="flex gap-2">
                           <div className="w-4 h-4 bg-black border-2 border-black" />
                           <div className="w-4 h-4 bg-black border-2 border-black" />
                        </div>
                    </div>
                    <div className="p-8 font-mono text-sm md:text-base text-white overflow-x-auto">
                        <p className="text-[#FF00FF] font-black">$ npm install @devnexus/sdk</p>
                        <p className="opacity-0">.</p>
                        <p className="text-[#00D1FF]">import &#123; <span className="text-white underline">Nexus</span> &#125; from &apos;@devnexus/sdk&apos;;</p>
                        <br />
                        <p className="text-gray-500 font-bold italic">{"// That's literally it."}</p>
                        <p className="text-[#FFD700]">Nexus.init(&#123;</p>
                        <p className="ml-8">id: <span className="text-[#00D1FF]">&apos;dn_live_920x&apos;</span>,</p>
                        <p className="ml-8 text-gray-500 italic">auto_remediate: <span className="text-[#FF00FF]">true</span></p>
                        <p className="text-[#FFD700]">&#125;);</p>
                    </div>
                </div>
            </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="py-40 bg-black text-white relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 relative z-10">
            <div className="mb-24 flex flex-col md:flex-row md:items-end justify-between gap-10 border-b-[6px] border-white pb-12">
              <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter">PRICING_PLANS</h2>
              <p className="text-xl font-bold max-w-sm italic opacity-80 underline decoration-[#FFD700]">SIMPLE. HONEST. BRUTAL.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
              {pricing.map((plan) => (
                <div 
                  key={plan.name}
                  className={cn(
                    "relative p-10 border-[6px] border-white transition-all hover:-translate-y-4 hover:-translate-x-2 shadow-[8px_8px_0_0_white]",
                    plan.color,
                    plan.popular ? "scale-105 z-20 shadow-[12px_12px_0_0_#00D1FF]" : ""
                  )}
                >
                  <div className="mb-10 text-black">
                    <h3 className="text-2xl font-black uppercase mb-2 tracking-tighter">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-6">
                        <span className="text-6xl font-[900] tracking-tighter">{plan.price}</span>
                        <span className="text-sm font-black uppercase">/MO</span>
                    </div>
                    <p className="font-bold text-sm leading-[1.2]">{plan.description}</p>
                  </div>
                  
                  <ul className="space-y-4 mb-12 text-black">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center text-sm font-black uppercase border-b border-black/10 pb-2">
                        <div className="w-3 h-3 bg-black mr-4" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link 
                    href="/auth/register"
                    className={cn(
                        "flex items-center justify-center w-full py-6 font-black text-xl uppercase border-4 border-black shadow-[6px_6px_0_0_black] transition-all hover:shadow-none hover:translate-x-1 hover:translate-y-1",
                        plan.popular ? "bg-black text-white" : "bg-white text-black"
                    )}
                  >
                    SELECT_PLAN
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-40 bg-[#FFD700] border-y-[4px] border-black">
            <div className="max-w-5xl mx-auto px-6 text-center">
                <div className="border-[6px] border-black p-12 md:p-24 bg-white shadow-[20px_20px_0_0_black]">
                    <h2 className="text-5xl md:text-8xl font-black mb-10 uppercase tracking-tighter leading-none">REGAIN_CONTROL</h2>
                    <p className="text-xl md:text-2xl font-black mb-16 opacity-70 italic">
                       &gt; Join 2,000+ engineers who prioritize uptime above all else.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-8">
                        <Link href="/auth/register" className="h-20 px-12 flex items-center justify-center bg-black text-white font-black text-2xl uppercase border-4 border-black hover:bg-white hover:text-black transition-all shadow-[8px_8px_0_0_#FF00FF]">
                            START_FREE
                        </Link>
                        <Link href="/docs" className="h-20 px-12 flex items-center justify-center bg-white text-black font-black text-2xl uppercase border-4 border-black hover:bg-black hover:text-white transition-all shadow-[8px_8px_0_0_black]">
                            DOCS.V1
                        </Link>
                    </div>
                </div>
            </div>
        </section>
      </main>

      {/* BRUTAL FOOTER */}
      <footer className="bg-black text-white py-24 px-12 border-t-[8px] border-[#FFD700]">
        <div className="max-w-7xl mx-auto flex flex-col gap-20">
            <div className="flex flex-col md:flex-row justify-between items-start gap-12">
                <div className="space-y-6">
                    <div className="flex items-center space-x-4">
                        <div className="w-8 h-8 bg-[#FFD700] border-2 border-white shadow-[4px_4px_0_0_white]" />
                        <span className="font-black text-4xl uppercase tracking-tighter italic">DevNexus.</span>
                    </div>
                    <p className="text-white/40 max-w-xs font-bold text-xs uppercase tracking-widest leading-loose">
                        Engineering resilience for a broken world. Built by systems engineers, for systems engineers.
                    </p>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-16 md:gap-32">
                    <div className="space-y-4">
                        <p className="font-black text-sm uppercase text-[#FFD700]">Internal</p>
                        <div className="flex flex-col gap-2 font-bold text-xs uppercase text-white/60">
                            <Link href="#" className="hover:text-white">Dashboard</Link>
                            <Link href="#" className="hover:text-white">Metrics</Link>
                            <Link href="#" className="hover:text-white">API_Keys</Link>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="font-black text-sm uppercase text-[#00D1FF]">Connect</p>
                        <div className="flex flex-col gap-2 font-bold text-xs uppercase text-white/60">
                            <Link href="#" className="hover:text-white">GitHub</Link>
                            <Link href="#" className="hover:text-white">Twitter_X</Link>
                            <Link href="#" className="hover:text-white">Discord</Link>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <p className="font-black text-sm uppercase text-[#FF00FF]">Legal</p>
                        <div className="flex flex-col gap-2 font-bold text-xs uppercase text-white/60">
                            <Link href="#" className="hover:text-white">EULA</Link>
                            <Link href="#" className="hover:text-white">Privacy</Link>
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="flex flex-col md:flex-row justify-between items-center border-t border-white/20 pt-12 gap-8">
                <div className="flex items-center gap-4">
                  <div className="bg-[#FFD700] text-black px-2 py-1 font-black text-[10px] uppercase">SERVICE_STABLE</div>
                  <div className="text-white/20 font-black text-[10px] tracking-widest">© 2026 NODE_MASTER_SYSTEMS</div>
                </div>
                <div className="flex gap-8">
                     <div className="w-8 h-8 border-2 border-white/20 flex items-center justify-center font-black text-[10px] text-white/20">01</div>
                     <div className="w-8 h-8 border-2 border-white/20 flex items-center justify-center font-black text-[10px] text-white/20">02</div>
                     <div className="w-8 h-8 border-2 border-white/20 flex items-center justify-center font-black text-[10px] text-white/20">03</div>
                </div>
            </div>
        </div>
      </footer>
    </div>
  );
}
