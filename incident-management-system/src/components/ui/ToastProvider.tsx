"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { RealtimeListener } from "@/components/dashboard/shared/RealtimeListener";


type ToastTone = "success" | "error" | "info";

interface ToastItem {
  id: string;
  title: string;
  description?: string;
  tone: ToastTone;
}

interface ToastContextValue {
  showToast: (toast: Omit<ToastItem, "id">) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  success: "border-emerald-500/30 bg-[#111113] text-white",
  error: "border-red-500/30 bg-[#111113] text-white",
  info: "border-white/[0.1] bg-[#111113] text-white",
};

const toneIcons = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
} satisfies Record<ToastTone, typeof Info>;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((toast: Omit<ToastItem, "id">) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id));
    }, 3200);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <RealtimeListener />


      <div className="pointer-events-none fixed top-5 right-5 z-[300] flex w-[min(92vw,22rem)] flex-col gap-3">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const Icon = toneIcons[toast.tone];

            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, x: 32, scale: 0.96 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 20, scale: 0.98 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className={cn(
                  "pointer-events-auto rounded-2xl border p-4 shadow-2xl shadow-black/30",
                  toneStyles[toast.tone]
                )}
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{toast.title}</p>
                    {toast.description ? (
                      <p className="mt-1 text-xs text-zinc-400">{toast.description}</p>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(toast.id)}
                    className="rounded-lg p-1 text-zinc-500 transition-colors hover:bg-white/[0.06] hover:text-white"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
