import { expect, test, describe, beforeEach, mock, spyOn } from "bun:test";
import { DevNexus, IssueSeverity } from "./index";

// Mock fetch globally for testing
const mockFetch = mock((url: string, init: any) => {
  return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
});
global.fetch = mockFetch as any;

// Mock navigator for flush logic
if (typeof navigator === "undefined") {
    (global as any).navigator = { onLine: true, userAgent: "Bun-Test" };
} else {
    (navigator as any).onLine = true;
}

describe("DevNexus SDK Logic", () => {
  beforeEach(() => {
    DevNexus.reset();
    mockFetch.mockClear();
    // Re-mock fetch in case it was changed by a specific test
    global.fetch = mockFetch as any;
  });

  test("Deduplication prevents rapid duplicate reports", async () => {
    const client = DevNexus.init({ apiKey: "test-key", autoCapture: false });
    
    // First report
    const r1 = await client.captureMessage("Same Error");
    expect(r1.success).toBe(true);

    // Immediate second report with same message
    const r2 = await client.captureMessage("Same Error");
    expect(r2.success).toBe(false);
    expect(r2.error).toBe("Duplicate suppressed");
  });

  test("Breadcrumbs are collected and sent with report", async () => {
    const client = DevNexus.init({ 
      apiKey: "test-key", 
      autoCapture: false,
      flushInterval: 0 // Manual flush
    });

    client.addBreadcrumb({ type: "manual", level: "info", message: "Step 1" });
    client.addBreadcrumb({ type: "manual", level: "info", message: "Step 2" });
    
    await client.captureMessage("Test Error");
    await client.flush();

    expect(mockFetch).toHaveBeenCalled();
    const lastCall = mockFetch.mock.calls[0];
    const body = JSON.parse(lastCall[1].body);
    
    const report = body.reports[0];
    expect(report.breadcrumbs).toHaveLength(3); // 2 manual + 1 from captureMessage
    expect(report.breadcrumbs[0].message).toBe("Step 1");
    expect(report.breadcrumbs[2].message).toBe("Message captured: Test Error");
  });

  test("captureException extracts stack trace", async () => {
    const client = DevNexus.init({ apiKey: "test-key", autoCapture: false });
    
    const error = new Error("Boom");
    await client.captureException(error);
    await client.flush();

    expect(mockFetch).toHaveBeenCalled();
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    const report = body.reports[0];
    expect(report.message).toBe("Boom");
    expect(report.stack).toBeDefined();
    expect(report.stack).toContain("Boom");
  });

  test("Retries on 500 errors", async () => {
    let attempts = 0;
    const failingFetch = mock(() => {
        attempts++;
        if (attempts < 2) {
            return Promise.resolve(new Response("Error", { status: 500 }));
        }
        return Promise.resolve(new Response(JSON.stringify({ success: true }), { status: 200 }));
    });
    global.fetch = failingFetch as any;

    const client = DevNexus.init({ 
        apiKey: "retry-test", 
        autoCapture: false, 
        maxRetries: 2,
        flushInterval: 10000 
    });

    await client.captureMessage("Retry me");
    await client.flush();

    expect(attempts).toBe(2);
  });

  test("Offline queue validation filters out malformed entries and keeps valid ones", async () => {
    let store: Record<string, string> = {};
    const mockLocalStorage = {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => { store[key] = value; },
      removeItem: (key: string) => { delete store[key]; },
      clear: () => { store = {}; }
    };
    (global as any).window = { 
      localStorage: mockLocalStorage,
      addEventListener: () => {}
    } as any;
    (global as any).localStorage = mockLocalStorage;
    
    const key = "devnexus_offline_queue:test-key-12";
    const now = Date.now();
    
    // Set up local storage with mixed valid and invalid entries
    const entries = [
      { message: "Valid error", timestamp: now, _persistedAt: now },
      { message: 12345, timestamp: now, _persistedAt: now }, // Invalid: message must be string
      { message: "Valid 2", tags: { env: "prod" }, timestamp: now, _persistedAt: now },
      { message: "Invalid tags", tags: { value: 123 }, timestamp: now, _persistedAt: now }, // Invalid: tags must contain only strings
      null,
      "string-instead-of-object",
    ];
    store[key] = JSON.stringify(entries);
    
    const client = DevNexus.init({
      apiKey: "test-key-12",
      persistOffline: true,
      autoCapture: false,
    });
    
    // DevNexusClient loads from storage on init. Access private queue to check.
    const loadedQueue = (client as any).queue;
    expect(loadedQueue).toHaveLength(2);
    expect(loadedQueue[0].message).toBe("Valid error");
    expect(loadedQueue[1].message).toBe("Valid 2");
    
    // Clean up window/localStorage mock
    delete (global as any).window;
    delete (global as any).localStorage;
  });
});
