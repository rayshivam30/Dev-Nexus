import nodemailer from "nodemailer";

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
});

interface SendMailOptions {
  to: string;
  subject: string;
  html: string;
}

/**
 * Send an email via Gmail SMTP.
 * Silently skips if GMAIL_USER or GMAIL_APP_PASSWORD are not configured.
 */
export async function sendMail({ to, subject, html }: SendMailOptions) {
  if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
    console.warn(
      "⚠️  GMAIL_USER or GMAIL_APP_PASSWORD not set — skipping email send."
    );
    return null;
  }

  const info = await transporter.sendMail({
    from: `DevNexus <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  });

  console.log("✅ Email sent:", info.messageId);
  return info;
}
