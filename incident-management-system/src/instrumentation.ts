export async function register() {
  // Build/prerender must not need production runtime secrets; validate at server boot.
  if (process.env.NEXT_RUNTIME === "nodejs" && process.env.NEXT_PHASE !== "phase-production-build") {
    const { validateEnvironment } = await import("@/lib/env");
    validateEnvironment();
  }
  // Background work runs in the dedicated `src/worker.ts` process.
}
