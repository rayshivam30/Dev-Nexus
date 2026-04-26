"use client";

import { useState } from "react";
import { useParams } from "next/navigation";

export default function InvitePage() {
  const params = useParams();
  const token = params?.token as string;

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!password) {
      alert("ENTER_ACCESS_CODE");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/accept-invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 🔥 Token is now kept secure via HttpOnly cookie set by the server

        const role = data.user.role;

        // 🔥 Role-based redirect
        if (role === "ADMIN") {
          window.location.href = "/dashboard/admin";
        } else if (role === "MANAGER") {
          window.location.href = "/dashboard/manager";
        } else if (role === "DEVELOPER") {
          window.location.href = "/dashboard/developer";
        } else {
          window.location.href = "/dashboard";
        }
      } else {
        alert(data.error || "SYSTEM_ERROR");
      }
    } catch (error) {
      console.error(error);
      alert("NETWORK_FAILURE");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">
      <div className="w-full max-w-md p-8 border-4 border-white bg-black shadow-[8px_8px_0_0_white]">
        {/* HEADER */}
        <h1 className="text-3xl font-black uppercase tracking-widest mb-2">
          ACCESS_INIT
        </h1>
        <p className="text-xs text-gray-400 mb-6">SECURE_INVITE_PROTOCOL</p>

        {/* INPUT */}
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest">
            ACCESS_CODE
          </label>

          <input
            type="password"
            placeholder="ENTER_CODE"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-14 px-4 bg-white text-black font-black border-4 border-black focus:outline-none focus:bg-[#FFD700] transition-all"
          />
        </div>

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-6 w-full h-14 bg-[#FFD700] text-black font-[900] uppercase tracking-widest border-4 border-black shadow-[6px_6px_0_0_black] hover:bg-white transition-all active:translate-x-1 active:translate-y-1 active:shadow-none disabled:opacity-50"
        >
          {loading ? "INITIALIZING..." : "AUTHORIZE_SESSION →"}
        </button>

        {/* FOOT */}
        <p className="text-[10px] text-gray-500 mt-6 text-center">
          DEVNEXUS_AUTH_NODE v1.0
        </p>
      </div>
    </div>
  );
}
