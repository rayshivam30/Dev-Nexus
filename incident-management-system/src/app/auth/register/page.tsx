"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";

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
      <div className="w-full max-w-md p-8 border border-border bg-card rounded-xl text-center space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Registration Successful</h2>
        <p className="text-foreground/70">
          Your admin account has been created and is currently <strong>PENDING APPROVAL</strong>.
        </p>
        <p className="text-sm text-foreground/50 border border-border p-3 rounded bg-accent/30 mt-4">
          Normally, you would receive an OTP email. Since this is local MVP testing, activate your account directly via the Database (`verify.ts` script logic).
        </p>
        <div className="pt-4">
          <Link href="/auth/login" className="inline-flex h-10 w-full items-center justify-center rounded-md bg-foreground px-8 text-sm font-medium text-background hover:opacity-90 transition-opacity">
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md p-8 border border-border bg-card rounded-xl space-y-6 shadow-xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Organization</h1>
        <p className="text-sm text-foreground/60">Enter your details to register as an Admin.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium">Organization Name</label>
          <input 
            name="orgName" 
            required 
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
            placeholder="Acme Corp"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Work Email</label>
          <input 
            type="email" 
            name="email" 
            required 
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
            placeholder="admin@acme.com"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Password</label>
          <input 
            type="password" 
            name="password" 
            required 
            minLength={6} 
            className="w-full px-3 py-2 bg-background border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-foreground transition-all" 
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full flex items-center justify-center h-10 rounded-md bg-foreground text-background font-medium hover:opacity-90 disabled:opacity-50 transition-opacity mt-6"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
            <>Create Account <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-foreground/60">
        Already have an account? <Link href="/auth/login" className="text-foreground font-medium hover:underline">Sign in</Link>
      </div>
    </div>
  );
}
