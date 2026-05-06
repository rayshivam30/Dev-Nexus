"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function InvitePage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  useEffect(() => {
    if (token) {
      router.push(`/auth/accept-invite?token=${token}`);
    } else {
      router.push("/auth/login");
    }
  }, [token, router]);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-8 h-8 animate-spin text-white/50" />
        <p className="text-sm text-white/50 animate-pulse font-medium">Authenticating secure invite link...</p>
      </div>
    </div>
  );
}
