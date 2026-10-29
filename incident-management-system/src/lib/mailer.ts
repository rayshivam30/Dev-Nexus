import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";
import { prisma } from "@/lib/db";
import { redis } from "@/lib/redis";

/**
 * Shared Nodemailer transporter using Gmail SMTP.
 *
 * Gmail env vars (when SMTP_HOST is not configured):
 *   GMAIL_USER          – your Gmail address (e.g. you@gmail.com)
 *   GMAIL_APP_PASSWORD  – a 16-char App Password generated from
 *                         https://myaccount.google.com/apppasswords
 */
const smtpHost = process.env.SMTP_HOST;
const gmailUser = process.env.GMAIL_USER;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");
const transporter = nodemailer.createTransport(smtpHost
  ? {
      host: smtpHost,
      port: Number(process.env.SMTP_PORT || 25),
      secure: process.env.SMTP_SECURE === "true",
      ...(process.env.SMTP_USER && process.env.SMTP_PASSWORD
        ? { auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD } }
        : {}),
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
    }
  : {
      service: "gmail",
      auth: { user: gmailUser, pass: gmailAppPassword },
      pool: true,
      maxConnections: 3,
      maxMessages: 50,
    });

function maskEmail(email?: string): string {
  if (!email) return "undefined";
  const parts = email.split("@");
  if (parts.length !== 2) return "[REDACTED]";
  const [local, domain] = parts;
  if (local.length <= 2) return `*@${domain}`;
  return `${local[0]}***${local[local.length - 1]}@${domain}`;
}

// Network checks must never run while Next is importing routes to build pages.
// Opt into a startup probe on the deployed Node server with this env flag.
if (process.env.SMTP_VERIFY_ON_STARTUP === "true") {
  void transporter
    .verify()
    .then(() => logger.info({ user: maskEmail(process.env.GMAIL_USER) }, "SMTP transporter ready"))
    .catch((err) => logger.warn({ err }, "SMTP transporter verification failed"));
}

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

// ── Durable email worker ──────────────────────────────────────────────────────
// Gmail limits: ~500 recipients/day. Jobs are claimed from Postgres so a restart
// cannot discard queued messages.

const MAX_EMAILS_PER_BATCH = 5;
const BATCH_INTERVAL_MS = process.env.NODE_ENV === "test" ? 250 : 20_000;

const DAILY_LIMIT = 450; // Stay under Gmail's 500/day with buffer

let durableEmailTimer: ReturnType<typeof setInterval> | undefined;
let durableEmailWorkerRunning = false;
const EMAIL_CLAIM_TIMEOUT_MS = 5 * 60_000;

function asEmailOptions(value: unknown): SendMailOptions | null {
  if (!value || typeof value !== "object") return null;
  const item = value as Record<string, unknown>;
  if (typeof item.to !== "string" || typeof item.subject !== "string" || typeof item.html !== "string") return null;
  return { to: item.to, subject: item.subject, html: item.html };
}

async function processDurableEmailJobs() {
  if (durableEmailWorkerRunning) return;
  durableEmailWorkerRunning = true;
  try {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - EMAIL_CLAIM_TIMEOUT_MS);
    const jobs = await prisma.job.findMany({
      where: {
        type: "EMAIL",
        runAfter: { lte: now },
        OR: [
          { status: "PENDING" },
          { status: "PROCESSING", lockedAt: { lt: staleBefore } },
        ],
      },
      orderBy: { createdAt: "asc" },
      take: MAX_EMAILS_PER_BATCH,
    });

    for (const job of jobs) {
      const claim = await prisma.job.updateMany({
        where: { id: job.id, status: job.status, updatedAt: job.updatedAt },
        data: { status: "PROCESSING", lockedAt: now, lockedBy: String(process.pid), attempts: { increment: 1 } },
      });
      if (claim.count !== 1) continue;

      const options = asEmailOptions(job.payload);
      if (!options) {
        await prisma.job.update({ where: { id: job.id }, data: { status: "FAILED", lockedAt: null, lockedBy: null, lastError: "Invalid email job payload" } });
        continue;
      }

      if (redis) {
        const day = new Date().toISOString().slice(0, 10);
        const limitKey = `email:daily:${day}`;
        const sentOrReserved = await redis.incr(limitKey);
        if (sentOrReserved === 1) await redis.expire(limitKey, 48 * 60 * 60);
        if (sentOrReserved > DAILY_LIMIT) {
          const nextDay = new Date(`${day}T00:00:00.000Z`);
          nextDay.setUTCDate(nextDay.getUTCDate() + 1);
          await prisma.job.update({ where: { id: job.id }, data: { status: "PENDING", runAfter: nextDay, lockedAt: null, lockedBy: null } });
          continue;
        }
      } else if (process.env.NODE_ENV === "production") {
        await prisma.job.update({ where: { id: job.id }, data: { status: "PENDING", runAfter: new Date(Date.now() + 60_000), lockedAt: null, lockedBy: null, lastError: "Redis required for email rate limiting" } });
        continue;
      }

      try {
        await transporter.sendMail({ from: `DevNexus <${gmailUser || "no-reply@devnexus.io"}>`, ...options });
        logger.info({ to: options.to, subject: options.subject }, "Email sent successfully");
        await prisma.job.update({ where: { id: job.id }, data: { status: "COMPLETE", lockedAt: null, lockedBy: null, lastError: null } });
      } catch (error) {
        logger.error({ to: options.to, err: error }, "Email delivery failed");
        const attempts = job.attempts + 1;
        const failed = attempts >= 5;
        const backoffMs = Math.min(60_000 * 2 ** (attempts - 1), 15 * 60_000);
        await prisma.job.update({
          where: { id: job.id },
          data: {
            status: failed ? "FAILED" : "PENDING",
            runAfter: failed ? job.runAfter : new Date(Date.now() + backoffMs),
            lockedAt: null,
            lockedBy: null,
            lastError: error instanceof Error ? error.message.slice(0, 500) : "Email delivery failed",
          },
        });
      }
    }
  } catch (error) {
    logger.error({ err: error }, "Durable email queue poll failed");
  } finally {
    durableEmailWorkerRunning = false;
  }
}

export function startEmailWorker() {
  if (durableEmailTimer || process.env.NEXT_RUNTIME === "edge") return;
  durableEmailTimer = setInterval(() => void processDurableEmailJobs(), BATCH_INTERVAL_MS);
  durableEmailTimer.unref();
  void processDurableEmailJobs();
  logger.info({ batchIntervalMs: BATCH_INTERVAL_MS, smtpHost: smtpHost || "gmail" }, "Durable email worker started");
}

/**
 * Persist email for delivery by the dedicated worker. Gmail SMTP remains the
 * default transport; SMTP_HOST is useful for local development and test sinks.
 */
export async function sendMail({ to, subject, html }: SendMailOptions) {
  const configured = Boolean(process.env.SMTP_HOST || (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD));
  if (!configured) {
    console.warn(
      "⚠️  SMTP_HOST or both GMAIL_USER and GMAIL_APP_PASSWORD must be configured — skipping email send."
    );
    return null;
  }

  const mailOptions = { from: `DevNexus <${process.env.GMAIL_USER || "no-reply@devnexus.io"}>`, to, subject, html };
  if (process.env.NODE_ENV !== "production" && process.env.EMAIL_SYNC === "true") {
    try {
      await transporter.sendMail(mailOptions);
      logger.info({ to, subject }, "Email sent synchronously");
      return { sent: true };
    } catch (err) {
      logger.error({ to, err }, "Synchronous email send failed");
      return null;
    }
  }

  await prisma.job.create({ data: { type: "EMAIL", payload: { to, subject, html } } });
  return { queued: true };
}

/**
 * Returns current email queue stats for monitoring.
 */
export async function getEmailQueueStats() {
  const now = new Date();
  const dayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const [queueLength, dailySentCount] = await Promise.all([
    prisma.job.count({ where: { type: "EMAIL", status: "PENDING" } }),
    prisma.job.count({ where: { type: "EMAIL", status: "COMPLETE", updatedAt: { gte: dayStart } } }),
  ]);
  return {
    queueLength,
    dailySentCount,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining: Math.max(0, DAILY_LIMIT - dailySentCount),
  };
}
