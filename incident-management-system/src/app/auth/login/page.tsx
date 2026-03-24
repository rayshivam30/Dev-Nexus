"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, Github, Chrome } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to login");
      }

      localStorage.setItem("incident_token", data.token);
      document.cookie = `incident_token=${data.token}; path=/; max-age=604800`;

      router.push("/dashboard/profile?source=login");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-4xl font-black tracking-tight tracking-[-0.04em]">Sign In</h1>
        <p className="text-white/40 text-sm font-medium tracking-tight">Access your resilient systems dashboard.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
          <button className="flex items-center justify-center space-x-2 py-3 border border-white/5 bg-white/[0.03] rounded-2xl hover:bg-white/[0.08] transition-all font-bold text-[10px] uppercase tracking-widest">
            <Github className="w-4 h-4" />
            <span>GitHub</span>
          </button>
          <button className="flex items-center justify-center space-x-2 py-3 border border-white/5 bg-white/[0.03] rounded-2xl hover:bg-white/[0.08] transition-all font-bold text-[10px] uppercase tracking-widest">
            <Chrome className="w-4 h-4" />
            <span>Google</span>
          </button>
      </div>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/5" />
        </div>
        <div className="relative flex justify-center text-[9px] uppercase tracking-[0.2em] font-black">
            <span className="bg-[#020408] px-4 text-white/20 font-mono">Or continue with</span>
        </div>
      </div>

      {error && (
        <div className="p-3 text-[11px] font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center">
          <span className="mr-2 text-base">🚨</span> {error}
        </div>
      )}

      <form onSubmit={onSubmit} method="post" className="space-y-4">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 ml-1">Work Email</label>
          <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.02] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-violet-500/50 focus:ring-4 focus:ring-violet-500/5 transition-all text-sm text-white placeholder:text-white/10" 
                placeholder="name@company.com"
              />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end mr-1">
             <label className="text-[10px] font-black uppercase tracking-[0.15em] text-white/30 ml-1">Password</label>
             <Link href="#" className="text-[9px] font-black uppercase tracking-widest text-violet-500 hover:text-violet-400 transition-colors">Forgot?</Link>
          </div>
          <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/10 group-focus-within:text-violet-500 transition-colors" />
              <input 
                type="password" 
                name="password" 
                required 
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
            <>Sign In <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></>
          )}
        </button>
      </form>

      <div className="text-center text-[10px] font-bold uppercase tracking-widest text-white/30 pb-2">
        Don't have an account? <Link href="/auth/register" className="text-white hover:text-violet-400 underline-offset-4 hover:underline transition-all">Create an organization</Link>
      </div>
    </div>
  );
}
