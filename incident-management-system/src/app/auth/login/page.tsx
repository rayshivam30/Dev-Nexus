"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";



export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    const formData = new FormData(e.currentTarget);
    const email = (formData.get("email") as string)?.trim() || "";
    const password = (formData.get("password") as string) || "";

    if (!email) {
      setError("Email is required.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    if (!password) {
      setError("Password is required.");
      return;
    }

    setLoading(true);
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
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-3"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.08] text-[11px] font-semibold text-white/50 mb-2">
          <span className="w-1.5 h-1.5 rounded-full bg-white/50" />
          Secure login
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-[1.1]">
          Welcome back
        </h1>
        <p className="text-base text-white/40 font-medium leading-relaxed">
          Sign in to access your incident dashboard.
        </p>
      </motion.div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: -8, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 bg-white/[0.04] border border-white/[0.1] rounded-2xl text-sm text-white/70 flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-white/[0.06] flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-4 h-4 text-white/60" />
              </div>
              <span className="font-medium">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <form onSubmit={onSubmit} method="post" className="space-y-5">
        {/* Email */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Email</label>
          <div className="relative group">
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                focusedField === "email"
                  ? "bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                  : "bg-white/[0.04]"
              }`}
            >
              <Mail className={`w-3.5 h-3.5 transition-colors duration-300 ${focusedField === "email" ? "text-white/80" : "text-white/30"}`} />
            </div>
            <input
              type="email"
              name="email"
              required
              onFocus={() => setFocusedField("email")}
              onBlur={() => setFocusedField(null)}
              className="w-full pl-16 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)] transition-all duration-300 text-sm placeholder:text-white/20 font-medium"
              placeholder="you@company.com"
            />
          </div>
        </motion.div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.23, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Password</label>
          <div className="relative group">
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                focusedField === "password"
                  ? "bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                  : "bg-white/[0.04]"
              }`}
            >
              <Lock className={`w-3.5 h-3.5 transition-colors duration-300 ${focusedField === "password" ? "text-white/80" : "text-white/30"}`} />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              required
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="w-full pl-16 pr-14 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)] transition-all duration-300 text-sm placeholder:text-white/20 font-medium"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.4 }}
        >
          <button
            type="submit"
            disabled={loading}
            className="group w-full flex items-center justify-center h-14 bg-white text-black rounded-2xl font-bold text-sm hover:shadow-[0_0_30px_rgba(255,255,255,0.15)] transition-all duration-300 disabled:opacity-50 mt-4 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <span className="flex items-center gap-2 relative z-10">
                Sign in <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </motion.div>
      </form>

      {/* Footer link */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-white/30 pt-6 border-t border-white/[0.05] font-medium"
      >
        New to DevNexus?{" "}
        <Link
          href="/auth/register"
          className="text-white/80 hover:text-white font-bold transition-colors relative group"
        >
          Create an account
          <span className="absolute bottom-0 left-0 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-300" />
        </Link>
      </motion.div>
    </div>
  );
}
