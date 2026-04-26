"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock } from "lucide-react";

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
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-4xl font-[900] tracking-tighter uppercase italic leading-none text-black">
          User <br /> 
          <span className="bg-[#FFD700] border-[2px] border-black px-2 shadow-[4px_4px_0_0_black]">AUTH_LOG:</span>
        </h1>
        <p className="text-black font-bold uppercase text-[10px] border-l-2 border-black pl-3 opacity-60">
          Access the primary resolution nexus.
        </p>
      </div>

      {/* OAuth integration removed for production readiness */}

      {error && (
        <div className="p-3 bg-[#FF00FF] text-white border-[2px] border-black font-black uppercase text-[11px] shadow-[4px_4px_0_0_black] flex items-center gap-3">
          <div className="bg-black text-white p-0.5">
             <Lock className="w-3 h-3" />
          </div>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} method="post" className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-black ml-1">EMAIL_ADDRESS</label>
          <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-14 pr-4 py-4 bg-white border-[2px] border-black focus:outline-none focus:bg-[#F0F0F0] focus:shadow-[4px_4px_0_0_black] transition-all text-sm font-bold placeholder:text-black/20" 
                placeholder="USER@DOMAIN.COM"
              />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between items-end">
             <label className="text-[11px] font-black uppercase tracking-widest text-black ml-1">ACCESS_CODE</label>
          </div>
          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <input 
                type="password" 
                name="password" 
                required 
                className="w-full pl-14 pr-4 py-4 bg-white border-[2px] border-black focus:outline-none focus:bg-[#F0F0F0] focus:shadow-[4px_4px_0_0_black] transition-all text-sm font-bold placeholder:text-black/20" 
                placeholder="••••••••"
              />
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center h-14 bg-[#FFD700] text-black border-[3px] border-black font-[900] text-lg uppercase tracking-tighter hover:bg-black hover:text-white shadow-[6px_6px_0_0_black] hover:shadow-none hover:translate-x-0.5 hover:translate-y-0.5 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? <Loader2 className="w-7 h-7 animate-spin" /> : (
            <>AUTHORIZE_SESSION <ArrowRight className="w-5 h-5 ml-4" /></>
          )}
        </button>
      </form>

      <div className="text-center text-[11px] font-black uppercase tracking-widest border-t border-black/10 pt-6">
        NEW_ORG? <Link href="/auth/register" className="text-black underline underline-offset-4 decoration-2 hover:bg-[#00D1FF] px-2 transition-colors ml-1">CREATE_ACCOUNT</Link>
      </div>
    </div>
  );
}
