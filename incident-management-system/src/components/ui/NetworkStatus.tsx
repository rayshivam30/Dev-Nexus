"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { AlertCircle, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Don't render anything during SSR to prevent hydration mismatch
  if (!isMounted) {
    return null;
  }

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 bg-red-950/90 border-b border-red-500/40 px-4 py-2.5 flex items-center justify-center gap-3 z-[9999] backdrop-blur-md"
        >
          <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
          <span className="text-xs font-semibold text-red-200">
            You are offline. DevNexus connection lost.
          </span>
        </motion.div>
      )}

      {isOnline && isSlowConnection && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-0 left-0 right-0 bg-amber-950/90 border-b border-amber-500/40 px-4 py-2.5 flex items-center justify-center gap-3 z-[9999] backdrop-blur-md"
        >
          <AlertCircle className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-200">
            Slow connection detected. Performance may be affected.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
