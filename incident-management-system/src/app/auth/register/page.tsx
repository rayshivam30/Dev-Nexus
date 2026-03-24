"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Building2, Mail, Lock, CheckCircle } from "lucide-react";

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("orgName");
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgName, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to register");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-8 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center border border-emerald-500/20 mx-auto lg:mx-0">
             <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
        <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Account Created.</h2>
            <p className="text-white/40 leading-relaxed font-medium">
              Your organization account is ready. For testing purposes, you can now sign in directly. Usually, you would verify your email first.
            </p>
        </div>
        
        <div className="pt-6">
          <Link href="/auth/login" className="flex items-center justify-center w-full h-14 rounded-2xl bg-white text-black font-black hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5">
            Go to Sign In <ArrowRight className="w-5 h-5 ml-2" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-4xl font-black tracking-tight tracking-[-0.04em]">Get Started</h2>
        <p className="text-white/40 text-sm font-medium tracking-tight">Register your organization to the DevNexus network.</p>
      </div>

      {error && (
        <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center">
          <span className="mr-2 text-base">🚨</span> {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 ml-1">Organization Name</label>
          <div className="relative group">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-violet-500 transition-colors" />
              <input 
                name="orgName" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-sm text-white placeholder:text-white/10" 
                placeholder="Acme Engineering"
              />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 ml-1">Admin Email</label>
          <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-sm text-white placeholder:text-white/10" 
                placeholder="admin@company.com"
              />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 ml-1">Password</label>
          <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="password" 
                name="password" 
                required 
                minLength={6} 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-sm text-white placeholder:text-white/10" 
                placeholder="••••••••"
              />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full group flex items-center justify-center h-14 rounded-2xl bg-white text-black font-black hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all mt-4 shadow-2xl shadow-white/5 uppercase tracking-widest text-xs"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Create Organization <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </form>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-white/30 pb-2">
        Already have an account? <Link href="/auth/login" className="text-white hover:text-violet-400 underline-offset-4 hover:underline transition-all">Sign in</Link>
      </div>
    </div>
  );
}
