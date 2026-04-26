import { expect, test, describe, beforeEach, mock, spyOn } from "bun:test";
import React from "react";
import { DevNexusErrorBoundary } from "./react";
import { DevNexus } from "./index";

// Mock DevNexus
const mockCaptureException = mock(() => Promise.resolve({ success: true }));
DevNexus.captureException = mockCaptureException as any;

describe("DevNexusErrorBoundary", () => {
  beforeEach(() => {
    mockCaptureException.mockClear();
  });

  test("captures errors from children", () => {
    const error = new Error("React Component Fail");
    const errorInfo = { componentStack: "at Component" };
    
    const boundary = new DevNexusErrorBoundary({ children: null });
    
    // Manually trigger the error lifecycle
    boundary.componentDidCatch(error, errorInfo);
    
    expect(mockCaptureException).toHaveBeenCalled();
    const lastCall = mockCaptureException.mock.calls[0];
    expect(lastCall[0]).toBe(error);
    expect(lastCall[1].metadata.componentStack).toBe("at Component");
    expect(lastCall[1].tags.source).toBe("react-error-boundary");
  });

  test("resets state when retry button is clicked", () => {
    const boundary = new DevNexusErrorBoundary({ children: "Normal UI" });
    boundary.state = { hasError: true, error: new Error("Fail") };
    
    // Mock setState to update state directly for the test
    boundary.setState = mock((updater: any) => {
      const nextState = typeof updater === "function" ? updater(boundary.state) : updater;
      boundary.state = { ...boundary.state, ...nextState };
    }) as any;

    boundary.resetBoundary();
    
    expect(boundary.state.hasError).toBe(false);
    expect(boundary.state.error).toBeNull();
  });
});
