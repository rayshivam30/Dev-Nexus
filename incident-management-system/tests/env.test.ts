import { afterEach, describe, expect, test } from "bun:test";
import { validateEnvironment } from "../src/lib/env";

const originalEnv = { ...process.env };

afterEach(() => {
  for (const key of Object.keys(process.env)) {
    if (!(key in originalEnv)) Reflect.deleteProperty(process.env, key);
  }
  Object.assign(process.env, originalEnv);
});

function setProductionEnv() {
  for (const key of ["UPSTASH_REDIS_REST_URL", "UPSTASH_REDIS_REST_TOKEN", "GITHUB_WEBHOOK_SECRET", "GMAIL_USER", "GMAIL_APP_PASSWORD"]) {
    Reflect.deleteProperty(process.env, key);
  }
  Object.assign(process.env, {
    NODE_ENV: "production",
    DATABASE_URL: "postgresql://test:test@localhost:5432/test",
    JWT_SECRET: "a-production-secret-that-is-at-least-32-chars",
    METRICS_BEARER_TOKEN: "metrics-test-token",
  });
}

describe("production environment validation", () => {
  test("requires Redis credentials and the GitHub webhook secret", () => {
    setProductionEnv();
    expect(() => validateEnvironment()).toThrow("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN: required in production");
    expect(() => validateEnvironment()).toThrow("GITHUB_WEBHOOK_SECRET: required in production");
  });

  test("accepts the production variables required by Compose", () => {
    setProductionEnv();
    Object.assign(process.env, {
      UPSTASH_REDIS_REST_URL: "https://redis.example.test",
      UPSTASH_REDIS_REST_TOKEN: "redis-test-token",
      GITHUB_WEBHOOK_SECRET: "webhook-test-secret",
    });
    expect(() => validateEnvironment()).not.toThrow();
  });
});
