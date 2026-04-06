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
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="space-y-12 py-10">
        <div className="w-24 h-24 bg-[#00D1FF] border-[4px] border-black flex items-center justify-center shadow-[8px_8px_0_0_black]">
             <CheckCircle className="w-12 h-12 text-black" />
        </div>
        <div className="space-y-6">
            <h2 className="text-6xl font-[900] tracking-tighter uppercase italic leading-none border-l-8 border-black pl-6">
               ORG_CREATED. <br />
               <span className="bg-[#FF00FF] text-white px-2">ACCESS_GRANTED.</span>
            </h2>
            <p className="text-black font-black uppercase text-sm leading-relaxed">
              Your organization account is ready. <br />
              <span className="opacity-50 italic">{"// Accessing the DevNexus node..."}</span>
            </p>
        </div>
        
        <div className="pt-6">
          <Link href="/auth/login" className="flex items-center justify-center w-full h-20 bg-white border-[4px] border-black text-black font-[900] text-xl uppercase tracking-tighter shadow-[10px_10px_0_0_black] hover:bg-black hover:text-white hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
            AUTHORIZE_SIGN_IN <ArrowRight className="w-6 h-6 ml-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-4xl font-[900] tracking-tighter uppercase italic leading-none text-black">
          New <br /> 
          <span className="bg-[#00D1FF] border-[2px] border-black px-2 shadow-[4px_4px_0_0_black]">NEXUS_DEV:</span>
        </h2>
        <p className="text-black font-bold uppercase text-[10px] border-l-2 border-black pl-3 opacity-60">
          Register your organization to the network.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FF00FF] text-white border-[2px] border-black font-black uppercase text-[11px] shadow-[4px_4px_0_0_black] flex items-center gap-3">
          <div className="bg-black text-white p-0.5">
             <Lock className="w-3 h-3" />
          </div>
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-black ml-1">ORG_NAME</label>
          <div className="relative">
              <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <input 
                name="orgName" 
                required 
                className="w-full pl-14 pr-4 py-4 bg-white border-[2px] border-black focus:outline-none focus:bg-[#F0F0F0] focus:shadow-[4px_4px_0_0_black] transition-all text-sm font-bold placeholder:text-black/20" 
                placeholder="ACME_CORP"
              />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-black ml-1">ADMIN_EMAIL</label>
          <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <input 
                type="email" 
                name="email" 
                required 
                className="w-full pl-14 pr-4 py-4 bg-white border-[2px] border-black focus:outline-none focus:bg-[#F0F0F0] focus:shadow-[4px_4px_0_0_black] transition-all text-sm font-bold placeholder:text-black/20" 
                placeholder="ADMIN@DOMAIN.COM"
              />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[11px] font-black uppercase tracking-widest text-black ml-1">SECURE_PASS</label>
          <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black/20" />
              <input 
                type="password" 
                name="password" 
                required 
                minLength={6} 
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
            <>CREATE_ORGANIZATION <ArrowRight className="w-5 h-5 ml-4" /></>
          )}
        </button>
      </form>

      <div className="text-center text-[11px] font-black uppercase tracking-widest border-t border-black/10 pt-6">
        DONE? <Link href="/auth/login" className="text-black underline underline-offset-4 decoration-2 hover:bg-[#FF00FF] hover:text-white px-2 transition-colors ml-1">SIGN_IN</Link>
      </div>
    </div>
  );
}
