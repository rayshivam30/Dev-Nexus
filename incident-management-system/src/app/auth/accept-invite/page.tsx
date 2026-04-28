"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, ShieldCheck, AlertCircle } from "lucide-react";

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

  useEffect(() => {
    if (token) {
      setEmail(decodeTokenEmail(token));
      setRole(decodeTokenRole(token));
    }
  }, [token]);

  if (!token) {
    return (
      <div className="space-y-8 py-10 text-center">
        <div className="flex justify-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-3xl font-extrabold tracking-tight">Invalid Invite Link</h1>
        <p className="text-sm text-zinc-500">
          This invite link is missing or malformed. Please ask your admin to resend the invite.
        </p>
      </div>
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
      <div className="space-y-8 py-10 text-center animate-in fade-in duration-500">
        <div className="flex justify-center">
          <ShieldCheck className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl font-extrabold tracking-tight">Account Created!</h2>
        <p className="text-zinc-500 text-sm">
          Welcome aboard. Redirecting you to your dashboard…
        </p>
        <Loader2 className="w-5 h-5 animate-spin mx-auto text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-3">
        <h1 className="text-3xl font-extrabold tracking-tight">Accept Invite</h1>
        <p className="text-sm text-zinc-500">
          You&apos;ve been invited as a{" "}

          <span className="font-semibold text-white capitalize">
            {role.toLowerCase()}
          </span>
          . Set your password to get started.
        </p>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          {error}
        </div>
      )}

      <form onSubmit={onSubmit} className="space-y-5">
        {/* Pre-filled email — read only */}
        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 ml-1">Email</label>
          <input
            type="email"
            value={email}
            readOnly
            className="w-full px-4 py-3.5 bg-white/[0.02] border border-white/[0.04] rounded-xl text-zinc-500 cursor-not-allowed focus:outline-none text-sm"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 ml-1">Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-700"
            placeholder="••••••••"
          />
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium text-zinc-500 ml-1">Confirm Password</label>
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-4 py-3.5 bg-white/[0.03] border border-white/[0.08] rounded-xl focus:outline-none focus:border-white/20 focus:bg-white/[0.05] transition-all text-sm placeholder:text-zinc-700"
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center h-12 bg-white text-black rounded-xl font-semibold text-sm hover:bg-white/90 transition-all disabled:opacity-50 mt-2"
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              Create Account <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </button>
      </form>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={
      <div className="space-y-8 py-10 text-center">
        <Loader2 className="w-6 h-6 animate-spin mx-auto text-zinc-500" />
      </div>
    }>
      <AcceptInviteContent />
    </Suspense>
  );
}
