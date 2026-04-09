/**
 * DevNexus SDK
 * A lightweight client for reporting errors and incidents to DevNexus.
 */

export enum IssueSeverity {
  LOW = "LOW",
  MEDIUM = "MEDIUM",
  HIGH = "HIGH",
  CRITICAL = "CRITICAL",
}

export interface DevNexusConfig {
  apiKey: string;
  baseUrl?: string;
  autoCapture?: boolean;
  maxRetries?: number;
}

export interface ReportContext {
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  severity?: IssueSeverity;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_BASE_URL   = "https://devnexus.vercel.app/api/ingest";
const DEDUP_WINDOW_MS    = 60_000; // suppress identical errors within 1 min
const DEDUP_MAX_SIZE     = 100;    // max fingerprints to keep in memory

class DevNexusClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private recentFingerprints = new Map<string, number>();

  constructor(config: DevNexusConfig) {
    this.apiKey     = config.apiKey;
    this.baseUrl    = config.baseUrl ?? DEFAULT_BASE_URL;
    this.maxRetries = config.maxRetries ?? 3;

    if (config.autoCapture !== false) {
      this.setupAutoCapture();
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async captureException(error: Error | unknown, context: ReportContext = {}) {
    const message = error instanceof Error ? error.message : String(error);
    const stack   = error instanceof Error ? error.stack  : undefined;
    return this.sendReport({ message, stack, ...context });
  }

  async captureMessage(message: string, context: ReportContext = {}) {
    return this.sendReport({ message, ...context });
  }

  // ── Deduplication ───────────────────────────────────────────────────────────

  private async fingerprint(payload: { message?: string; stack?: string }): Promise<string> {
    const raw = `${payload.message ?? ""}::${(payload.stack ?? "").substring(0, 200)}`;
    
    if (typeof crypto !== "undefined" && crypto.subtle) {
      try {
        const encoder = new TextEncoder();
        const data = encoder.encode(raw);
        const hashBuffer = await crypto.subtle.digest('SHA-1', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      } catch (e) {
        // Fallback to djb2 below
      }
    }

    let h = 5381;
    for (let i = 0; i < raw.length; i++) {
      h = ((h << 5) + h) ^ raw.charCodeAt(i);
    }
    return (h >>> 0).toString(36);
  }

  private async isDuplicate(payload: { message?: string; stack?: string }): Promise<boolean> {
    const fp  = await this.fingerprint(payload);
    const now = Date.now();
    const lastSeen = this.recentFingerprints.get(fp);

    if (lastSeen && now - lastSeen < DEDUP_WINDOW_MS) return true;

    // Evict stale entries when the map gets too large
    if (this.recentFingerprints.size >= DEDUP_MAX_SIZE) {
      for (const [key, ts] of this.recentFingerprints) {
        if (now - ts >= DEDUP_WINDOW_MS) this.recentFingerprints.delete(key);
      }
    }

    this.recentFingerprints.set(fp, now);
    return false;
  }

  // ── Network ─────────────────────────────────────────────────────────────────

  private async sendReport(
    payload: Record<string, unknown>
  ): Promise<{ success: boolean; issueId?: string; error?: string }> {
    if (await this.isDuplicate(payload as { message?: string; stack?: string })) {
      console.log(`[DevNexus] Suppressed duplicate: "${payload.message}"`);
      return { success: false, error: "Duplicate suppressed" };
    }

    console.log(
      `%c[DevNexus] 🚨 Reporting: ${payload.message}`,
      "color: #ff4d4d; font-weight: bold;"
    );
    if (payload.stack) console.error(payload.stack);

    const browserInfo =
      typeof navigator !== "undefined" ? navigator.userAgent : "Node.js";
    const osInfo =
      typeof process !== "undefined"
        ? `${process.platform} ${process.arch}`
        : "Browser";

    const body = JSON.stringify({ ...payload, browserInfo, osInfo });

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const res = await fetch(this.baseUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${this.apiKey}`,
          },
          body,
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({})) as Record<string, unknown>;
          const errMsg  = String(errData.error ?? `HTTP ${res.status}`);

          // 4xx = client error, no point retrying
          if (res.status >= 400 && res.status < 500) {
            console.error(`[DevNexus] Client error (${res.status}):`, errMsg);
            return { success: false, error: errMsg };
          }

          // 5xx = server error, retry with backoff
          if (attempt < this.maxRetries) {
            await this.sleep(attempt * 1000);
            continue;
          }
          console.error("[DevNexus] Failed after retries:", errMsg);
          return { success: false, error: errMsg };
        }

        const data = await res.json() as { issueId?: string; warning?: string };
        if (data.warning) console.warn("[DevNexus] ⚠️", data.warning);
        return { success: true, issueId: data.issueId };
      } catch (err) {
        if (attempt < this.maxRetries) {
          await this.sleep(attempt * 1000);
          continue;
        }
        console.error("[DevNexus] Network error:", err);
        return { success: false, error: "Network error" };
      }
    }

    return { success: false, error: "Max retries exceeded" };
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  // ── Auto-capture ────────────────────────────────────────────────────────────

  private setupAutoCapture() {
    if (typeof window !== "undefined") {
      // Browser: global error
      const prevOnError = window.onerror;
      window.onerror = (message, source, lineno, _colno, error) => {
        // Use HIGH (not CRITICAL) — onerror fires for many non-fatal things
        this.captureException(error || message, {
          tags: { source: "window.onerror", file: String(source), line: String(lineno) },
          severity: IssueSeverity.HIGH,
        }).catch(() => {}); // prevent unhandled rejection from the SDK itself
        if (prevOnError) return prevOnError(message, source, lineno, _colno, error);
        return false;
      };

      // Browser: unhandled promise rejection
      window.addEventListener("unhandledrejection", (event) => {
        this.captureException(event.reason, {
          tags: { source: "unhandledrejection" },
          severity: IssueSeverity.HIGH,
        }).catch(() => {});
      });
    } else if (typeof process !== "undefined" && process.on) {
      // Node.js: unhandled rejection
      process.on("unhandledRejection", (reason) => {
        this.captureException(reason, {
          tags: { source: "unhandledRejection" },
          severity: IssueSeverity.CRITICAL,
        }).catch(() => {});
      });

      // Node.js: uncaught exception
      process.on("uncaughtException", (error) => {
        this.captureException(error, {
          tags: { source: "uncaughtException" },
          severity: IssueSeverity.CRITICAL,
        }).catch(() => {});
      });
    }
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────

let instance: DevNexusClient | null = null;

export const DevNexus = {
  /**
   * Initialize the DevNexus SDK. Call this once at your app's entry point.
   */
  init(config: DevNexusConfig): DevNexusClient {
    if (instance) {
      console.warn(
        "[DevNexus] Already initialized. Ignoring duplicate init() call. " +
          "Call DevNexus.reset() first if you need to re-configure."
      );
      return instance;
    }
    instance = new DevNexusClient(config);
    return instance;
  },

  captureException(error: unknown, context?: ReportContext) {
    if (!instance) throw new Error("[DevNexus] Not initialized. Call DevNexus.init() first.");
    return instance.captureException(error, context);
  },

  captureMessage(message: string, context?: ReportContext) {
    if (!instance) throw new Error("[DevNexus] Not initialized. Call DevNexus.init() first.");
    return instance.captureMessage(message, context);
  },

  /** Reset the singleton (useful for testing or reconfiguration). */
  reset() {
    instance = null;
  },
};

export default DevNexus;
