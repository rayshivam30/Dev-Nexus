"use client";

import { motion } from "framer-motion";
import { ArrowRight, Database, ShieldCheck, Zap } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

const features = [
  { icon: ShieldCheck, title: "SLA Enforcement", description: "Strict monitoring of response and resolution timelines with automated escalations." },
  { icon: Zap, title: "AI Triaging", description: "Smart deduplication and root cause analysis powered by machine learning." },
  { icon: Database, title: "Deep Integrations", description: "Native GitHub webhooks and SDKs for instantaneous error catching." }
];

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-foreground selection:text-background">
      {/* Minimal Navbar */}
      <header className="fixed top-0 w-full border-b border-border bg-background/80 backdrop-blur-md z-50 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-5 h-5 bg-foreground rounded-sm" />
          <span className="font-bold tracking-tight text-lg">Incident.</span>
        </div>
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-foreground/70">
          <Link href="#features" className="hover:text-foreground transition-colors">Features</Link>
          <Link href="#pricing" className="hover:text-foreground transition-colors">Pricing</Link>
        </nav>
        <div className="flex items-center space-x-4">
          <Link href="/auth/login" className="text-sm font-medium hover:underline underline-offset-4">Sign In</Link>
          <Link 
            href="/auth/register" 
            className="text-sm font-medium bg-foreground text-background px-4 py-2 rounded-md hover:opacity-90 transition-opacity"
          >
            Start Free
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center justify-center pt-32 pb-20 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center border border-border rounded-full px-3 py-1 mb-10 text-xs font-mono uppercase tracking-widest text-foreground/60"
        >
          <span className="w-2 h-2 rounded-full bg-foreground mr-3 animate-pulse" />
          System Operational
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.5 }}
          className="text-6xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.9] max-w-6xl"
        >
          Zero friction. <br />
          <span className="text-foreground/30">Max resolution.</span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="mt-8 text-xl md:text-2xl text-foreground/60 max-w-2xl font-light"
        >
          The minimalist incident management platform built for high-velocity engineering teams.
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex flex-col sm:flex-row gap-4 mt-12"
        >
          <Link href="/dashboard" className={cn(
            "flex items-center justify-center h-12 px-8 rounded-lg bg-foreground text-background font-semibold hover:scale-[1.02] active:scale-[0.98] transition-transform"
          )}>
            Go to Dashboard <ArrowRight className="ml-2 w-4 h-4" />
          </Link>
          <Link href="/docs" className={cn(
            "flex items-center justify-center h-12 px-8 rounded-lg border border-border bg-transparent font-medium hover:bg-accent transition-colors"
          )}>
             Read the Docs
          </Link>
        </motion.div>
      </main>

      {/* Grid Features */}
      <section className="border-t border-border grid grid-cols-1 md:grid-cols-3">
        {features.map((feature, idx) => (
          <motion.div 
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            className="p-10 border-b md:border-b-0 md:border-r border-border last:border-r-0 hover:bg-accent/30 transition-colors"
          >
            <feature.icon className="w-8 h-8 mb-6 text-foreground" />
            <h3 className="text-xl font-bold mb-3 tracking-tight">{feature.title}</h3>
            <p className="text-foreground/60 leading-relaxed">{feature.description}</p>
          </motion.div>
        ))}
      </section>

      {/* Minimal Footer */}
      <footer className="border-t border-border py-10 md:py-16 text-center text-sm font-mono uppercase tracking-widest text-foreground/40">
        &copy; {new Date().getFullYear()} AI Incident Management.
      </footer>
    </div>
  );
}
