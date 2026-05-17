import nodemailer from "nodemailer";
import { logger } from "@/lib/logger";

/**
 * Shared Nodemailer transporter using Gmail SMTP.
 *
 * Required env vars:
 *   GMAIL_USER          – your Gmail address (e.g. you@gmail.com)
 *   GMAIL_APP_PASSWORD  – a 16-char App Password generated from
 *                         https://myaccount.google.com/apppasswords
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
  // Connection pooling — reuse SMTP connections for better throughput
  pool: true,
  maxConnections: 3,
  maxMessages: 50,
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

// ── Email Queue & Throttling ─────────────────────────────────────────────────
// Gmail limits: ~500 recipients/day, ~20 emails/minute.
// This queue processes at most MAX_EMAILS_PER_BATCH every BATCH_INTERVAL_MS
// to stay safely under the limits.

const MAX_EMAILS_PER_BATCH = 5;
const BATCH_INTERVAL_MS = 20_000; // 5 emails every 20 seconds = ~15/min
const MAX_QUEUE_SIZE = 200;

interface QueuedEmail {
  options: SendMailOptions;
  retries: number;
  addedAt: number;
}

const emailQueue: QueuedEmail[] = [];
let isProcessing = false;
let dailySentCount = 0;
let dailyResetAt = getNextMidnight();

function getNextMidnight(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return midnight.getTime();
}

function resetDailyCountIfNeeded() {
  if (Date.now() >= dailyResetAt) {
    dailySentCount = 0;
    dailyResetAt = getNextMidnight();
  }
}

const DAILY_LIMIT = 450; // Stay under Gmail's 500/day with buffer

async function processEmailQueue() {
  if (isProcessing || emailQueue.length === 0) return;
  isProcessing = true;

  resetDailyCountIfNeeded();

  const batch = emailQueue.splice(0, MAX_EMAILS_PER_BATCH);
  
  for (const item of batch) {
    if (dailySentCount >= DAILY_LIMIT) {
      logger.warn(
        { dailySentCount, limit: DAILY_LIMIT, queueLength: emailQueue.length },
        "Daily email limit reached, requeueing remaining emails"
      );
      // Put remaining items back
      emailQueue.unshift(item);
      break;
    }

    try {
      await transporter.sendMail({
        from: `DevNexus <${process.env.GMAIL_USER}>`,
        to: item.options.to,
        subject: item.options.subject,
        html: item.options.html,
      });
      dailySentCount++;
      logger.info(
        { to: item.options.to, subject: item.options.subject, dailySent: dailySentCount },
        "Email sent successfully"
      );
    } catch (error) {
      if (item.retries < 2) {
        item.retries++;
        emailQueue.push(item); // Retry at end of queue
        logger.warn(
          { to: item.options.to, attempt: item.retries, err: error },
          "Email send failed, will retry"
        );
      } else {
        logger.error(
          { to: item.options.to, err: error },
          "Email send failed after max retries, dropping"
        );
      }
    }
  }

  isProcessing = false;
}

// Process queue periodically
const queueTimer = setInterval(processEmailQueue, BATCH_INTERVAL_MS);
queueTimer.unref(); // Don't keep process alive

/**
 * Queue an email for throttled delivery via Gmail SMTP.
 * Returns immediately — the email is sent asynchronously.
 * Silently skips if Gmail credentials are not configured.
 */
export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      "⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email send."
    );
    return null;
  }

  if (emailQueue.length >= MAX_QUEUE_SIZE) {
    logger.warn(
      { queueSize: emailQueue.length, to },
      "Email queue full, dropping email"
    );
    return null;
  }

  emailQueue.push({
    options: { to, subject, html },
    retries: 0,
    addedAt: Date.now(),
  });

  // Attempt immediate processing if not already running
  if (!isProcessing) {
    processEmailQueue();
  }

  return { queued: true, queueLength: emailQueue.length };
}

/**
 * Returns current email queue stats for monitoring.
 */
export function getEmailQueueStats() {
  resetDailyCountIfNeeded();
  return {
    queueLength: emailQueue.length,
    dailySentCount,
    dailyLimit: DAILY_LIMIT,
    dailyRemaining: Math.max(0, DAILY_LIMIT - dailySentCount),
  };
}
