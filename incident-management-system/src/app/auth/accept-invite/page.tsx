"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck, AlertCircle, Lock, Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Safely decode email from the JWT payload (middle segment, base64url encoded)
function decodeTokenEmail(token: string): string {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.email || "";
  } catch {
    return "";
  }
}

function decodeTokenRole(token: string): string {
  try {
    const payload = token.split(".")[1];
    const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));
    return decoded.role || "";
  } catch {
    return "";
  }
}



function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      setEmail(decodeTokenEmail(token));
      setRole(decodeTokenRole(token));
    }
  }, [token]);

  if (!token) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="space-y-6 text-center"
      >
        <div className="w-16 h-16 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8 text-white/60" />
        </div>
        <h1 className="text-3xl font-black tracking-tighter">Invalid Invite Link</h1>
        <p className="text-sm text-white/40 max-w-xs mx-auto">
          This invite link is missing or malformed. Please ask your admin to resend the invite.
        </p>
      </motion.div>
    );
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Something went wrong.");
      }

      // Save session token & cookie — same pattern as login page
      localStorage.setItem("incident_token", data.token);
      document.cookie = `incident_token=${data.token}; path=/; max-age=604800`;

      // Redirect to the correct dashboard based on role
      const roleDashboard: Record<string, string> = {
        ADMIN: "/dashboard/admin",
        MANAGER: "/dashboard/manager",
        DEVELOPER: "/dashboard/developer",
      };
      const destination = roleDashboard[data.user.role] || "/dashboard";

      setSuccess(true);
      setTimeout(() => router.push(destination), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
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
        className="space-y-8 text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-2xl bg-white/[0.04] border border-white/[0.1] flex items-center justify-center mx-auto"
        >
          <ShieldCheck className="w-10 h-10 text-white" />
        </motion.div>
        <div className="space-y-3">
          <h2 className="text-3xl font-black tracking-tighter">Account Created!</h2>
          <p className="text-sm text-white/40">
            Welcome aboard. Redirecting you to your dashboard…
          </p>
        </div>
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/30" />
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
          <UserPlus className="w-3 h-3 text-white/50" />
          Team invite
        </div>
        <h1 className="text-4xl font-black tracking-tighter leading-[1.1]">Accept Invite</h1>
        <p className="text-base text-white/40 font-medium leading-relaxed">
          You&apos;ve been invited as a{" "}
          <span className="text-white/80 font-bold capitalize">
            {role.toLowerCase()}
          </span>
          . Set your password to get started.
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
        {/* Email (read-only) */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Email</label>
          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center bg-white/[0.04]">
              <Mail className="w-3.5 h-3.5 text-white/25" />
            </div>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full pl-16 pr-4 py-4 bg-white/[0.02] border border-white/[0.06] rounded-2xl text-white/40 cursor-not-allowed focus:outline-none text-sm font-medium"
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
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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

        {/* Confirm Password */}
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.31, duration: 0.4, ease: [0.22, 1, 0.36, 1] }} className="space-y-2">
          <label className="text-[11px] font-semibold text-white/30 uppercase tracking-wider ml-1">Confirm Password</label>
          <div className="relative group">
            <div
              className={`absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                focusedField === "confirm"
                  ? "bg-white/10 shadow-[0_0_12px_rgba(255,255,255,0.08)]"
                  : "bg-white/[0.04]"
              }`}
            >
              <Lock className={`w-3.5 h-3.5 transition-colors duration-300 ${focusedField === "confirm" ? "text-white/80" : "text-white/30"}`} />
            </div>
            <input
              type={showConfirmPassword ? "text" : "password"}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              onFocus={() => setFocusedField("confirm")}
              onBlur={() => setFocusedField(null)}
              className="w-full pl-16 pr-14 py-4 bg-white/[0.03] border border-white/[0.08] rounded-2xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] focus:shadow-[0_0_0_4px_rgba(255,255,255,0.03)] transition-all duration-300 text-sm placeholder:text-white/20 font-medium"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white/60 hover:bg-white/[0.06] transition-all"
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </motion.div>

        {/* Submit */}
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
                Create Account <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </span>
            )}
          </button>
        </motion.div>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 py-10 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-white/30" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
