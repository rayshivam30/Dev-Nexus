import { expect, test, describe, afterEach, beforeEach } from "bun:test";
import { getBaseUrl } from "../src/lib/utils";

describe("Utility Functions", () => {
  const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

  beforeEach(() => {
    delete process.env.NEXT_PUBLIC_APP_URL;
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  test("getBaseUrl returns NEXT_PUBLIC_APP_URL if defined", () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://my-domain.com";
    expect(getBaseUrl()).toBe("https://my-domain.com");
  });

  test("getBaseUrl returns localhost fallback if env is missing", () => {
    // Note: In bun:test/node, window is undefined
    expect(getBaseUrl()).toContain("http://localhost:");
  });
});
