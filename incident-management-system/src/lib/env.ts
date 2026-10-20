import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().url().refine((value) => value.startsWith("postgres://") || value.startsWith("postgresql://"), "must be a PostgreSQL URL"),
  JWT_SECRET: z.string().min(32).optional(),
  GEMINI_API_KEY: z.string().optional(),
  DEVNEXUS_E2E_FAKE_AI: z.enum(["true", "false"]).optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional().or(z.literal("")),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),
  GMAIL_USER: z.string().optional(),
  GMAIL_APP_PASSWORD: z.string().optional(),
  SMTP_HOST: z.string().min(1).optional().or(z.literal("")),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  METRICS_BEARER_TOKEN: z.string().optional(),
  SMTP_VERIFY_ON_STARTUP: z.enum(["true", "false"]).optional(),
  NEXT_PUBLIC_GITHUB_APP_SLUG: z.string().optional(),
  GITHUB_APP_ID: z.string().optional(),
  GITHUB_CLIENT_ID: z.string().optional(),
  GITHUB_CLIENT_SECRET: z.string().optional(),
  GITHUB_WEBHOOK_SECRET: z.string().optional(),
  TEST_SDK_API_KEY: z.string().optional(),
  NEXT_PUBLIC_DEVNEXUS_SDK_KEY: z.string().optional(),
  PORT: z.coerce.number().int().positive().optional(),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).optional(),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export function validateEnvironment() {
  const parsed = envSchema.safeParse(process.env);
  const issues = parsed.success ? [] : parsed.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);

  if (process.env.NODE_ENV === "production" && !process.env.JWT_SECRET) {
    issues.push("JWT_SECRET: required in production");
  }
  if (process.env.NODE_ENV === "production" && !process.env.METRICS_BEARER_TOKEN) {
    issues.push("METRICS_BEARER_TOKEN: required in production");
  }
  if (process.env.NODE_ENV === "production" && (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN)) {
    issues.push("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN: required in production");
  }
  if (process.env.NODE_ENV === "production" && !process.env.GITHUB_WEBHOOK_SECRET) {
    issues.push("GITHUB_WEBHOOK_SECRET: required in production");
  }
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    issues.push("JWT_SECRET: must contain at least 32 characters");
  }
  if (Boolean(process.env.UPSTASH_REDIS_REST_URL) !== Boolean(process.env.UPSTASH_REDIS_REST_TOKEN)) {
    issues.push("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set together");
  }
  if (Boolean(process.env.GMAIL_USER) !== Boolean(process.env.GMAIL_APP_PASSWORD)) {
    issues.push("GMAIL_USER and GMAIL_APP_PASSWORD must be set together");
  }
  if (Boolean(process.env.SMTP_USER) !== Boolean(process.env.SMTP_PASSWORD)) {
    issues.push("SMTP_USER and SMTP_PASSWORD must be set together");
  }

  if (issues.length) throw new Error(`Invalid environment configuration:\n- ${issues.join("\n- ")}`);
}
