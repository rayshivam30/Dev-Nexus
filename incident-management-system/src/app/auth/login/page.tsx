"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, AlertCircle } from "lucide-react";

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

      // Note: The token is now set securely via an HttpOnly cookie from the server.

      router.push("/dashboard/profile?source=login");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to login");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8 bg-white/[0.02] border border-white/10 p-10 rounded-[32px] backdrop-blur-3xl shadow-2xl">
      <div className="space-y-3">
        <h1 className="text-4xl font-black tracking-tighter">
          Welcome back
        </h1>
        <p className="text-base text-white/50 font-medium">
          Sign in to access your incident dashboard.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} method="post" className="space-y-5">
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 ml-1">Email</label>
          <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-600 backdrop-blur-md" 
                placeholder="you@company.com"
              />
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 ml-1">Password</label>
          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-600 backdrop-blur-md" 
                placeholder="••••••••"
              />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center h-14 bg-white text-black rounded-full font-bold text-base hover:bg-white/90 transition-all disabled:opacity-50 mt-6 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
            <>Sign in <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-500 border-t border-white/[0.06] pt-6 font-medium">
        New to DevNexus?{" "}
        <Link href="/auth/register" className="text-white hover:text-white/80 font-bold transition-colors">
          Create an account
        </Link>
      </div>
    </div>
  );
}
