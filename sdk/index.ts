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
  flushInterval?: number; // ms
  /** Persist queued reports in localStorage. Disabled by default to limit sensitive data exposure. */
  persistOffline?: boolean;
  /** Hook to modify or scrub data before it is sent. Return null to cancel. */
  beforeSend?: (payload: any) => any | null;
}

export interface ReportContext {
  tags?: Record<string, string>;
  metadata?: Record<string, unknown>;
  severity?: IssueSeverity;
}

export interface Breadcrumb {
  type: "console" | "navigation" | "error" | "manual";
  level: "info" | "warn" | "error";
  message: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ── Constants ─────────────────────────────────────────────────────────────────
const DEFAULT_BASE_URL   = "https://devnexus.vercel.app/api/ingest";
const DEDUP_WINDOW_MS    = 60_000; // suppress identical errors within 1 min
const DEDUP_MAX_SIZE     = 100;    // max fingerprints to keep in memory
const MAX_BREADCRUMBS    = 20;
const DEFAULT_FLUSH_INT  = 5000;
const STORAGE_KEY        = "devnexus_offline_queue";
const STORAGE_TTL_MS     = 24 * 60 * 60 * 1000; // 24 hours

function isValidQueueEntry(entry: any): boolean {
  if (typeof entry !== "object" || entry === null) return false;
  if (entry.message !== undefined && typeof entry.message !== "string") return false;
  if (entry.stack !== undefined && typeof entry.stack !== "string") return false;
  if (entry.browserInfo !== undefined && typeof entry.browserInfo !== "string") return false;
  if (entry.osInfo !== undefined && typeof entry.osInfo !== "string") return false;
  if (entry.timestamp !== undefined && typeof entry.timestamp !== "number") return false;
  if (entry._persistedAt !== undefined && typeof entry._persistedAt !== "number") return false;
  
  if (entry.tags !== undefined) {
    if (typeof entry.tags !== "object" || entry.tags === null) return false;
    for (const key of Object.keys(entry.tags)) {
      if (typeof entry.tags[key] !== "string") return false;
    }
  }
  
  if (entry.metadata !== undefined) {
    if (typeof entry.metadata !== "object" || entry.metadata === null) return false;
  }
  
  if (entry.breadcrumbs !== undefined) {
    if (!Array.isArray(entry.breadcrumbs)) return false;
    for (const crumb of entry.breadcrumbs) {
      if (typeof crumb !== "object" || crumb === null) return false;
      if (typeof crumb.message !== "string") return false;
      if (typeof crumb.type !== "string") return false;
      if (typeof crumb.level !== "string") return false;
      if (typeof crumb.timestamp !== "number") return false;
    }
  }
  
  return true;
}

class DevNexusClient {
  private apiKey: string;
  private baseUrl: string;
  private maxRetries: number;
  private beforeSend?: (payload: any) => any | null;
  private recentFingerprints = new Map<string, number>();
  private breadcrumbs: Breadcrumb[] = [];
  private queue: any[] = [];
  private flushTimer: any = null;
  private flushInterval: number;
  private persistOffline: boolean;
  private storageKey: string;

  constructor(config: DevNexusConfig) {
    this.apiKey     = config.apiKey;
    this.baseUrl    = config.baseUrl ?? DEFAULT_BASE_URL;
    this.maxRetries = config.maxRetries ?? 3;
    this.flushInterval = config.flushInterval ?? DEFAULT_FLUSH_INT;
    this.beforeSend = config.beforeSend;
    this.persistOffline = config.persistOffline ?? false;
    this.storageKey = `${STORAGE_KEY}:${config.apiKey.slice(-12)}`;

    this.loadFromStorage();

    if (config.autoCapture !== false) {
      this.setupAutoCapture();
      this.setupBreadcrumbs();
    }

    this.startFlushTimer();
    this.setupNetworkListeners();
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async captureException(error: Error | unknown, context: ReportContext = {}) {
    const message = error instanceof Error ? error.message : String(error);
    const stack   = error instanceof Error ? error.stack  : undefined;
    
    this.addBreadcrumb({
      type: "error",
      level: "error",
      message: `Exception captured: ${message}`,
    });

    return this.queueReport({ message, stack, ...context });
  }

  async captureMessage(message: string, context: ReportContext = {}) {
    this.addBreadcrumb({
      type: "manual",
      level: "info",
      message: `Message captured: ${message}`,
    });
    return this.queueReport({ message, ...context });
  }

  /** Add a manual breadcrumb to the trail. */
  addBreadcrumb(crumb: Omit<Breadcrumb, "timestamp">) {
    this.breadcrumbs.push({
      ...crumb,
      timestamp: Date.now(),
    });

    if (this.breadcrumbs.length > MAX_BREADCRUMBS) {
      this.breadcrumbs.shift();
    }
  }

  /** Force flush the current queue. */
  async flush() {
    if (this.queue.length === 0) return;
    
    // Check if offline (Browser only)
    if (typeof navigator !== "undefined" && !navigator.onLine) {
        return; 
    }

    const batch = [...this.queue];
    this.queue = [];
    this.saveToStorage(); 

    return this.sendBatch(batch);
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
      } catch (e) {}
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

    if (this.recentFingerprints.size >= DEDUP_MAX_SIZE) {
      for (const [key, ts] of this.recentFingerprints) {
        if (now - ts >= DEDUP_WINDOW_MS) this.recentFingerprints.delete(key);
      }
    }

    this.recentFingerprints.set(fp, now);
    return false;
  }

  // ── Network ─────────────────────────────────────────────────────────────────

  private async queueReport(payload: Record<string, unknown>) {
    if (await this.isDuplicate(payload as { message?: string; stack?: string })) {
      return { success: false, error: "Duplicate suppressed" };
    }
    
    const browserInfo = typeof navigator !== "undefined" ? navigator.userAgent : "Node.js";
    const osInfo = typeof process !== "undefined" ? `${process.platform} ${process.arch}` : "Browser";

    let report = {
        ...payload,
        browserInfo,
        osInfo,
        breadcrumbs: [...this.breadcrumbs],
        timestamp: Date.now()
    };

    // Scrub data if hook exists
    if (this.beforeSend) {
        try {
            const scrubbed = this.beforeSend(report);
            if (!scrubbed) return { success: false, error: "Cancelled by beforeSend" };
            report = scrubbed;
        } catch (e) {
            console.error("[DevNexus] beforeSend hook failed:", e);
        }
    }

    this.queue.push(report);
    this.saveToStorage();

    return { success: true, message: "Report queued" };
  }

  private async sendBatch(batch: any[]) {
    const body = JSON.stringify({ isBatch: true, reports: batch });

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
           if (res.status >= 500 && attempt < this.maxRetries) {
             await this.sleep(attempt * 1000);
             continue;
           }
           // On failure, put back in queue if it's potentially recoverable
           this.queue = [...batch, ...this.queue];
           this.saveToStorage();
           return { success: false };
        }

        return { success: true };
      } catch (err) {
        if (attempt < this.maxRetries) {
          await this.sleep(attempt * 1000);
          continue;
        }
        this.queue = [...batch, ...this.queue];
        this.saveToStorage();
        return { success: false };
      }
    }
  }

  // ── Persistence ─────────────────────────────────────────────────────────────

  private saveToStorage() {
      if (!this.persistOffline || typeof window === "undefined" || !window.localStorage) return;
      try {
          // Strip stack traces from persisted entries to limit sensitive data exposure
          const safeQueue = this.queue.slice(-50).map(entry => {
            const { stack, ...rest } = entry;
            return { ...rest, _persistedAt: Date.now() };
          });
          localStorage.setItem(this.storageKey, JSON.stringify(safeQueue));
      } catch (e) {}
  }

  private loadFromStorage() {
      if (!this.persistOffline || typeof window === "undefined" || !window.localStorage) return;
      try {
          const stored = localStorage.getItem(this.storageKey);
          if (stored) {
              const parsed = JSON.parse(stored);
              // Discard entries older than TTL
              const now = Date.now();
              this.queue = Array.isArray(parsed)
                ? parsed
                    .filter((entry: any) => isValidQueueEntry(entry))
                    .filter((entry: any) => !entry._persistedAt || (now - entry._persistedAt) < STORAGE_TTL_MS)
                : [];
              // Clean up storage if all entries expired
              if (this.queue.length === 0) {
                localStorage.removeItem(this.storageKey);
              }
          }
      } catch (e) {}
  }

  private setupNetworkListeners() {
      if (typeof window === "undefined") return;
      window.addEventListener("online", () => this.flush());
  }

  private startFlushTimer() {
    if (this.flushTimer) clearInterval(this.flushTimer);
    this.flushTimer = setInterval(() => this.flush(), this.flushInterval);
    
    if (typeof window !== "undefined") {
        window.addEventListener("beforeunload", () => this.flush());
    }
  }

  private sleep(ms: number) {
    return new Promise<void>((resolve) => setTimeout(resolve, ms));
  }

  // ── Instrumentation ─────────────────────────────────────────────────────────

  private setupBreadcrumbs() {
    if (typeof window === "undefined") return;

    const levels: ("log" | "warn" | "error")[] = ["log", "warn", "error"];
    levels.forEach(level => {
      const original = (console as any)[level];
      (console as any)[level] = (...args: any[]) => {
        this.addBreadcrumb({
          type: "console",
          level: level === "log" ? "info" : level,
          message: args.map(a => String(a)).join(" "),
        });
        original.apply(console, args);
      };
    });

    window.addEventListener("popstate", () => {
      this.addBreadcrumb({
        type: "navigation",
        level: "info",
        message: `Navigated to ${window.location.pathname}`,
      });
    });

    const originalPushState = window.history.pushState;
    window.history.pushState = function(...args) {
      originalPushState.apply(this, args);
      (DevNexus as any)._instance?.addBreadcrumb({
        type: "navigation",
        level: "info",
        message: `Navigated to ${window.location.pathname}`,
      });
    };

    const originalReplaceState = window.history.replaceState;
    window.history.replaceState = function(...args) {
      originalReplaceState.apply(this, args);
      (DevNexus as any)._instance?.addBreadcrumb({
        type: "navigation",
        level: "info",
        message: `Navigated (replaced) to ${window.location.pathname}`,
      });
    };
  }

  // ── Auto-capture ────────────────────────────────────────────────────────────

  private setupAutoCapture() {
    if (typeof window !== "undefined") {
      window.addEventListener("error", (event) => {
        const error = event.error;
        const message = event.message || "Unknown error";
        const file = event.filename || "";
        const line = event.lineno ? String(event.lineno) : "";
        
        this.captureException(error || message, {
          tags: { source: "window.onerror", file, line },
          severity: IssueSeverity.HIGH,
        }).catch(() => {});
      }, true);

      window.addEventListener("unhandledrejection", (event) => {
        this.captureException(event.reason, {
          tags: { source: "unhandledrejection" },
          severity: IssueSeverity.HIGH,
        }).catch(() => {});
      }, true);
    } else if (typeof process !== "undefined" && process.on) {
      process.on("unhandledRejection", (reason) => {
        this.captureException(reason, {
          tags: { source: "unhandledRejection" },
          severity: IssueSeverity.CRITICAL,
        }).catch(() => {});
      });

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
  get _instance() { return instance; },

  init(config: DevNexusConfig): DevNexusClient {
    if (instance) {
      console.warn("[DevNexus] Already initialized.");
      return instance;
    }
    instance = new DevNexusClient(config);
    return instance;
  },

  captureException(error: unknown, context?: ReportContext) {
    if (!instance) throw new Error("[DevNexus] Not initialized.");
    return instance.captureException(error, context);
  },

  captureMessage(message: string, context?: ReportContext) {
    if (!instance) throw new Error("[DevNexus] Not initialized.");
    return instance.captureMessage(message, context);
  },

  addBreadcrumb(crumb: Omit<Breadcrumb, "timestamp">) {
    if (!instance) throw new Error("[DevNexus] Not initialized.");
    return instance.addBreadcrumb(crumb);
  },

  async flush() {
    if (!instance) throw new Error("[DevNexus] Not initialized.");
    return instance.flush();
  },

  reset() {
    if (instance && (instance as any).flushTimer) {
        clearInterval((instance as any).flushTimer);
    }
    instance = null;
  },
};

export default DevNexus;
