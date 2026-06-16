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
    pass: process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, ""),
  },
  // Connection pooling — reuse SMTP connections for better throughput
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

// Verify transporter at startup and log any auth/connection issues early
transporter
  .verify()
  .then(() => logger.info({ user: maskEmail(process.env.GMAIL_USER) }, "SMTP transporter ready"))
  .catch((err) => logger.warn({ err }, "SMTP transporter verification failed"));

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

export function pruneStaleEmails() {
  const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
  const originalLength = emailQueue.length;
  let i = 0;
  while (i < emailQueue.length) {
    if (emailQueue[i].addedAt < twoHoursAgo) {
      emailQueue.splice(i, 1);
    } else {
      i++;
    }
  }
  if (emailQueue.length < originalLength) {
    logger.info(
      { pruned: originalLength - emailQueue.length, currentLength: emailQueue.length },
      "Pruned stale emails from queue"
    );
  }
}

async function processEmailQueue() {
  pruneStaleEmails();
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
  // Allow pasting the 16-char Gmail App Password with or without spaces
  const gmailUser = process.env.GMAIL_USER;
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s+/g, "");

  if (!gmailUser || !gmailAppPassword) {
    console.warn(
      "⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set or invalid — skipping email send."
    );
    return null;
  }

  const mailOptions = {
    from: `DevNexus <${gmailUser}>`,
    to,
    subject,
    html,
  };

  // In production (or when explicitly requested) send synchronously so serverful
  // hosts perform the send during the request and we immediately surface errors.
  if (process.env.NODE_ENV === "production" || process.env.EMAIL_SYNC === "true") {
    try {
      await transporter.sendMail(mailOptions);
      logger.info({ to, subject }, "Email sent synchronously (production)");
      return { sent: true };
    } catch (err) {
      logger.error({ to, err }, "Synchronous email send failed");
      return null;
    }
  }

  pruneStaleEmails();

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
