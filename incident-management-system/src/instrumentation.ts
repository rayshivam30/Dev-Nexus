export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startAiWorker } = await import("./lib/ai-worker");
    startAiWorker();
  }
}
