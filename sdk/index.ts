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
}

export interface ReportContext {
  tags?: Record<string, string>;
  metadata?: Record<string, any>;
  severity?: IssueSeverity;
}

class DevNexusClient {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: DevNexusConfig) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || "https://devnexus.vercel.app/api/ingest"; // Default production URL

    if (config.autoCapture !== false) {
      this.setupAutoCapture();
    }
  }

  /**
   * Manually capture an exception.
   */
  async captureException(error: Error | any, context: ReportContext = {}) {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;

    return this.sendReport({
      message,
      stack,
      ...context,
    });
  }

  /**
   * Manually capture a message.
   */
  async captureMessage(message: string, context: ReportContext = {}) {
    return this.sendReport({
      message,
      ...context,
    });
  }

  private async sendReport(payload: any) {
    try {
      // Log to console/terminal locally
      console.log(`%c[DevNexus] 🚨 Reporting Issue: ${payload.message}`, "color: #ff4d4d; font-weight: bold;");
      if (payload.stack) console.error(payload.stack);

      // Gather environment info
      const browserInfo = typeof navigator !== "undefined" ? navigator.userAgent : "Node.js";
      const osInfo = typeof process !== "undefined" ? `${process.platform} ${process.arch}` : "Browser";

      const res = await fetch(this.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          ...payload,
          browserInfo,
          osInfo,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error("DevNexus SDK Error:", errorData.error || "Failed to report issue");
        return { success: false, error: errorData.error };
      }

      const data = await res.json();
      return { success: true, issueId: data.issueId };
    } catch (err) {
      console.error("DevNexus SDK Network Error:", err);
      return { success: false, error: "Network error" };
    }
  }

  private setupAutoCapture() {
    if (typeof window !== "undefined") {
      // Browser global error handler
      const oldOnError = window.onerror;
      window.onerror = (message, source, lineno, colno, error) => {
        this.captureException(error || message, {
          tags: { source: "window.onerror", file: String(source), line: String(lineno) },
          severity: IssueSeverity.CRITICAL,
        });
        if (oldOnError) return oldOnError(message, source, lineno, colno, error);
        return false;
      };

      // Unhandled promise rejections
      window.addEventListener("unhandledrejection", (event) => {
        this.captureException(event.reason, {
          tags: { source: "unhandledrejection" },
          severity: IssueSeverity.HIGH,
        });
      });
    } else if (typeof process !== "undefined" && process.on) {
      // Node.js unhandled rejection handler
      process.on("unhandledRejection", (reason: any) => {
        this.captureException(reason, {
          tags: { source: "unhandledRejection" },
          severity: IssueSeverity.CRITICAL,
        });
      });

      process.on("uncaughtException", (error: any) => {
        this.captureException(error, {
          tags: { source: "uncaughtException" },
          severity: IssueSeverity.CRITICAL,
        }).finally(() => {
          // It's good practice to exit after uncaughtException,
          // but we leave that to the user's application logic.
        });
      });
    }
  }
}

let instance: DevNexusClient | null = null;

export const DevNexus = {
  init: (config: DevNexusConfig) => {
    instance = new DevNexusClient(config);
    return instance;
  },
  captureException: (error: any, context?: ReportContext) => {
    if (!instance) throw new Error("DevNexus SDK not initialized. Call DevNexus.init() first.");
    return instance.captureException(error, context);
  },
  captureMessage: (message: string, context?: ReportContext) => {
    if (!instance) throw new Error("DevNexus SDK not initialized. Call DevNexus.init() first.");
    return instance.captureMessage(message, context);
  },
};

export default DevNexus;
