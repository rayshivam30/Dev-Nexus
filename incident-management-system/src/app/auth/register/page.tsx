"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Building2, Mail, Lock, AlertCircle } from "lucide-react";

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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-8 py-10">
        <div className="w-16 h-16 bg-white/[0.03] border border-white/[0.08] rounded-2xl flex items-center justify-center">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <div className="space-y-3">
          <h2 className="text-3xl font-extrabold tracking-tight">
            Verify your email
          </h2>
          <p className="text-zinc-500 text-sm">
            We&apos;ve sent a verification link to your email address. Please check your inbox and click the link to activate your account.
          </p>
          <p className="text-zinc-600 text-xs">
            Didn&apos;t receive the email? Check your spam folder.
          </p>
        </div>
        
        <Link href="/auth/login" className="flex items-center justify-center w-full h-14 bg-white/5 border border-white/10 text-white rounded-full font-bold text-base hover:bg-white/10 transition-all backdrop-blur-md">
          Go to Sign in <ArrowRight className="w-5 h-5 ml-2" />
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 bg-white/[0.02] border border-white/10 p-10 rounded-[32px] backdrop-blur-3xl shadow-2xl">
      <div className="space-y-3">
        <h2 className="text-4xl font-black tracking-tighter">
          Create your account
        </h2>
        <p className="text-base text-white/50 font-medium">
          Register your organization to get started.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 ml-1">Organization name</label>
            <div className="relative">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  name="orgName" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-600 backdrop-blur-md" 
                  placeholder="Acme Corp"
                />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500 ml-1">Admin email</label>
            <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-600" />
                <input 
                  type="email" 
                  name="email" 
                  required 
                  className="w-full pl-12 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/30 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-600 backdrop-blur-md" 
                  placeholder="admin@company.com"
                />
            </div>
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
                minLength={6} 
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
            <>Create organization <ArrowRight className="w-5 h-5 ml-2" /></>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-zinc-500 border-t border-white/[0.06] pt-6 font-medium">
        Already have an account?{" "}
        <Link href="/auth/login" className="text-white hover:text-white/80 font-bold transition-colors">
          Sign in
        </Link>
      </div>
    </div>
  );
}
