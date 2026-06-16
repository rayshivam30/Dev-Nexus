"use client";

import { useNetworkStatus } from "@/hooks/use-network-status";
import { AlertCircle, WifiOff } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function NetworkStatus() {
  const { isOnline, isSlowConnection } = useNetworkStatus();

  return (
    <AnimatePresence mode="wait">
      {!isOnline && (
        <motion.div
          key="offline"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 border-b border-red-500/40 bg-red-950/90 px-4 py-2.5 backdrop-blur-md"
        >
          <WifiOff className="h-4 w-4 animate-pulse text-red-400" />
          <span className="text-xs font-semibold text-red-200">
            You are offline. DevNexus connection lost.
          </span>
        </motion.div>
      )}

      {isOnline && isSlowConnection && (
        <motion.div
          key="slow-connection"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 border-b border-amber-500/40 bg-amber-950/90 px-4 py-2.5 backdrop-blur-md"
        >
          <AlertCircle className="h-4 w-4 text-amber-400" />
          <span className="text-xs font-semibold text-amber-200">
            Slow connection detected. Performance may be affected.
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}