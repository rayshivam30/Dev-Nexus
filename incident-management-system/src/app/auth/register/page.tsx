"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Loader2, Building2, Mail, Lock, AlertCircle, Eye, EyeOff, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ── Password strength calculator ── */
function getPasswordStrength(password: string): { score: number; label: string; color: string } {
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(password);

  if (password.length < 12) {
    return { score: 0, label: "Too Short", color: "bg-red-500" };
  }

  let score = 1;
  let charTypeCount = 0;
  if (hasUpperCase) charTypeCount++;
  if (hasLowerCase) charTypeCount++;
  if (hasNumbers) charTypeCount++;
  if (hasSpecialChar) charTypeCount++;

  if (charTypeCount === 4 && password.length >= 12) score = 2;
  if (password.length >= 16) score = 3;
  if (password.length >= 20 && /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]{2,}/.test(password)) score = 4;

  if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar || password.length > 128) {
    return { score: 1, label: "Weak/Invalid", color: "bg-orange-500" };
  }

  if (score === 1) return { score, label: "Fair", color: "bg-yellow-500" };
  if (score === 2) return { score, label: "Good", color: "bg-lime-500" };
  if (score === 3) return { score, label: "Strong", color: "bg-green-500" };
  return { score: 4, label: "Very Strong", color: "bg-emerald-500" };
}



export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [password, setPassword] = useState("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const formData = new FormData(e.currentTarget);
    const orgName = formData.get("orgName");
    const email = formData.get("email");

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
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="space-y-8"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.4, type: "spring", stiffness: 200, damping: 12 }}
          >
            <CheckCircle2 className="w-10 h-10 text-white" />
          </motion.div>
        </motion.div>

        <div className="space-y-3">
          <motion.h2
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl font-black tracking-tighter"
          >
            Check your inbox
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-sm text-white/40 leading-relaxed"
          >
            We&apos;ve sent a verification link to your email address. Click the link to activate your account.
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-white/25"
          >
            Didn&apos;t receive it? Check your spam folder.
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            href="/auth/login"
            className="group flex items-center justify-center w-full h-14 bg-white/[0.06] border border-white/[0.1] text-white rounded-2xl font-bold text-sm hover:bg-white/[0.1] hover:border-white/[0.15] transition-all duration-300"
          >
            Go to Sign in <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Link>
        </motion.div>
      </motion.div>
    );
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
          <Sparkles className="w-3 h-3 text-white/50" />
          Free to start
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-[1.1]">
          Create your account
        </h1>
        <p className="text-base text-white/40 font-medium leading-relaxed">
          Register your organization to get started.
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
      <form onSubmit={onSubmit} className="space-y-5">
        {/* Organization + Email row */}
        <div className="grid grid-cols-1 gap-5">
          {/* Org Name */}
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Organization</label>
            <div className="relative group">
              <div
                className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                  focusedField === "org"
                    ? "bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                    : "bg-white/[0.04]"
                }`}
              >
                <Building2 className={`w-3.5 h-3.5 transition-colors duration-300 ${focusedField === "org" ? "text-white/80" : "text-white/30"}`} />
              </div>
              <input
                name="orgName"
                required
                onFocus={() => setFocusedField("org")}
                onBlur={() => setFocusedField(null)}
                className="w-full pl-16 pr-4 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)] transition-all duration-300 text-sm placeholder:text-white/20 font-medium"
                placeholder="Acme Corp"
              />
            </div>
          </motion.div>

          {/* Email */}
          <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.23, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
            <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Admin Email</label>
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
                placeholder="admin@company.com"
              />
            </div>
          </motion.div>
        </div>

        {/* Password */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.31, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
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
              minLength={12}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setFocusedField("password")}
              onBlur={() => setFocusedField(null)}
              className="w-full pl-16 pr-14 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)] transition-all duration-300 text-sm placeholder:text-white/20 font-medium"
              placeholder="Min. 12 characters"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength meter */}
          <AnimatePresence>
            {password.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-3 mt-2 px-1">
                  <div className="flex-1 flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <motion.div
                        key={level}
                        className={`h-1 rounded-full flex-1 ${
                          level <= passwordStrength.score ? passwordStrength.color : "bg-white/[0.08]"
                        }`}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        transition={{ delay: level * 0.05, duration: 0.3 }}
                      />
                    ))}
                  </div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                    passwordStrength.score <= 1 ? "text-white/30" :
                    passwordStrength.score <= 2 ? "text-white/50" :
                    passwordStrength.score <= 3 ? "text-white/70" : "text-white"
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Submit button */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
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
                Create organization <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-white/80 hover:text-white font-bold transition-colors relative group"
        >
          Sign in
          <span className="absolute bottom-0 left-0 w-0 h-px bg-white/40 group-hover:w-full transition-all duration-300" />
        </Link>
      </motion.div>
    </div>
  );
}
