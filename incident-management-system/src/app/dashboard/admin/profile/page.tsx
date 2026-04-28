"use client";

import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { ProfileClient } from "@/components/dashboard/shared/ProfileClient";

export default function AdminProfilePage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-400" />
      </div>
    }>
      <ProfileClient />
    </Suspense>
  );
}
