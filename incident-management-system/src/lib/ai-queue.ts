import { logger } from "@/lib/logger";

/**
 * AI Request Queue & Concurrency Limiter
 *
 * Gemini free-tier: 15 RPM (requests per minute).
 * This module ensures we never exceed that by:
 *   1. Limiting concurrent AI calls to MAX_CONCURRENT (3).
 *   2. Spacing calls with a minimum interval (MIN_INTERVAL_MS = 4.5s → ~13 RPM max).
 *   3. Queuing excess requests and processing them in order.
 *   4. Retrying with exponential backoff + jitter on 429/5xx errors.
 */

const MAX_CONCURRENT = 3;
const MIN_INTERVAL_MS = 4_500; // ~13 RPM stays safely under 15 RPM
const MAX_QUEUE_SIZE = 200;
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2_000;

let activeCount = 0;
let lastCallTime = 0;
let totalSuccessCount = 0;
let totalFailureCount = 0;

interface QueueItem<T> {
  task: () => Promise<T>;
  resolve: (value: T) => void;
  reject: (reason: unknown) => void;
  retries: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const queue: QueueItem<any>[] = [];

function getJitteredDelay(attempt: number): number {
  const delay = BASE_DELAY_MS * Math.pow(2, attempt);
  const jitter = delay * 0.3 * Math.random();
  return delay + jitter;
}

async function processQueue(): Promise<void> {
  if (activeCount >= MAX_CONCURRENT || queue.length === 0) return;

  const item = queue.shift();
  if (!item) return;

  // Enforce minimum interval between calls
  const now = Date.now();
  const timeSinceLast = now - lastCallTime;
  if (timeSinceLast < MIN_INTERVAL_MS) {
    const waitTime = MIN_INTERVAL_MS - timeSinceLast;
    await new Promise((r) => setTimeout(r, waitTime));
  }

  activeCount++;
  lastCallTime = Date.now();

  try {
    const result = await item.task();
    totalSuccessCount++;
    item.resolve(result);
  } catch (error: unknown) {
    const isRateLimit = error instanceof Error && (
      error.message.includes("429") ||
      error.message.includes("RESOURCE_EXHAUSTED") ||
      error.message.includes("quota")
    );
    const isServerError = error instanceof Error && (
      error.message.includes("500") ||
      error.message.includes("503")
    );

    if ((isRateLimit || isServerError) && item.retries < MAX_RETRIES) {
      const delay = getJitteredDelay(item.retries);
      logger.warn(
        { attempt: item.retries + 1, delayMs: delay },
        "AI call failed, requeueing with backoff"
      );
      item.retries++;
      // Put back in queue after delay
      setTimeout(() => {
        queue.unshift(item);
        processQueue();
      }, delay);
      return; // Don't process next yet
    }

    totalFailureCount++;
    item.reject(error);
  } finally {
    if (activeCount > 0) activeCount--;
  }

  // Process next item
  processQueue();
}

/**
 * Enqueue an AI task. Returns a promise that resolves when the task completes.
 * Rejects immediately if the queue is full (backpressure).
 */
export function enqueueAITask<T>(task: () => Promise<T>): Promise<T> {
  if (queue.length >= MAX_QUEUE_SIZE) {
    logger.warn({ queueSize: queue.length }, "AI queue full, rejecting task");
    return Promise.reject(new Error("AI queue is full. Please try again later."));
  }

  return new Promise<T>((resolve, reject) => {
    queue.push({ task, resolve, reject, retries: 0 });
    processQueue();
  });
}

/**
 * Returns current queue stats for monitoring/logging.
 */
export function getQueueStats() {
  const totalProcessed = totalSuccessCount + totalFailureCount;
  const successRate = totalProcessed > 0 ? (totalSuccessCount / totalProcessed) * 100 : 100;
  return {
    activeCount,
    queueLength: queue.length,
    maxConcurrent: MAX_CONCURRENT,
    maxQueueSize: MAX_QUEUE_SIZE,
    totalSuccessCount,
    totalFailureCount,
    successRate: parseFloat(successRate.toFixed(2)),
  };
}
