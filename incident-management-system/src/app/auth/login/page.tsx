"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

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

      // Save token to localStorage for authenticated API requests
      localStorage.setItem("incident_token", data.token);
      
      // Also save to cookie if we want server-rendering to see it easily
      document.cookie = `incident_token=${data.token}; path=/; max-age=604800`;

      // Redirect to the profile setup page first
      router.push("/dashboard/profile?source=login");
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-md p-8 border border-border bg-card rounded-xl space-y-6 shadow-xl">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Welcome Back</h1>
        <p className="text-sm text-foreground/60">Sign in to your account to continue.</p>
      </div>

      {error && (
        <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-md">
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} method="post" className="space-y-4">
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
            <>Sign In <ArrowRight className="w-4 h-4 ml-2" /></>
          )}
        </button>
      </form>

      <div className="text-center text-sm text-foreground/60">
        Don't have an account? <Link href="/auth/register" className="text-foreground font-medium hover:underline">Register</Link>
      </div>
    </div>
  );
}
