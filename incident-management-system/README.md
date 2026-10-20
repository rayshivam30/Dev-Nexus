<div align="center">
  <h1>🚨 DevNexus Incident Management System</h1>
  <p>An incident inbox for small engineering teams, with grouped reports, triage, and optional AI-assisted analysis.</p>
</div>

---

## 🌟 Overview

DevNexus ingests reports from client SDKs and GitHub webhooks, groups matching SDK reports, and provides issue triage. New issue groups are queued for Gemini analysis when a valid API key is configured. Notifications and live updates are available through the application APIs.

Built with **Next.js (App Router)**, **TypeScript**, **Prisma**, **PostgreSQL**, and optional **Upstash Redis** and **Gemini AI** integrations. Production capacity depends on the deployment configuration.

## 🚀 Key Features

*   **⚡ Ingestion Controls:** Uses payload limits, rate limiting, and Redis-backed event delivery when configured.
*   **🤖 AI-Assisted Analysis:** Stores analysis status and retry state on issues so pending analysis can be recovered after a process restart.
*   **📡 Live Notifications:** Provides Server-Sent Events (SSE) for dashboard updates.
*   **🏢 Multi-Tenant RBAC:** Complete Role-Based Access Control isolating environments for **Admins** (organization oversight), **Managers** (project management), and **Developers** (issue resolution).
*   **📧 Email Notifications:** SMTP settings and notification email paths are available; delivery depends on runtime configuration.
*   **🔗 GitHub Integration:** Seamlessly connects with GitHub repositories via webhooks to track CI/CD deployments and automatically generate issues from pipeline failures.

## Background Worker and Routing

Run the app and worker as separate processes in a self-hosted deployment:

```bash
bun run start
bun run worker
```

The worker claims AI analysis, SLA sweep, and email jobs from PostgreSQL. Docker Compose starts the worker as its own service. Project admins and managers can list, create, and remove routing rules through `/api/projects/{projectId}/routing-rules`; the project settings page provides the same controls. Rules match severity, a `key=value` tag, a path prefix, or message text, and apply to newly created issue groups.

## 🏗️ Architecture

- **Frontend/Backend:** Next.js 16 (App Router) & React 19
- **Database:** PostgreSQL (Neon) managed by Prisma ORM
- **Event Bus & Caching:** Upstash Redis (REST API)
- **AI Engine:** Google Gemini SDK
- **Styling:** Tailwind CSS, Framer Motion, and Lucide Icons

---

## 🛠️ Getting Started

### Docker Compose

The Compose stack is intended for local use and binds the app and PostgreSQL
ports to `127.0.0.1`. It requires `POSTGRES_PASSWORD`, `JWT_SECRET`,
`GITHUB_WEBHOOK_SECRET`, `UPSTASH_REDIS_REST_URL`,
`UPSTASH_REDIS_REST_TOKEN`, and `METRICS_BEARER_TOKEN` in the environment.
Redis is accessed through Upstash REST; the app does not connect to a native
Redis container. Copy the root `.env.example` to `.env`, fill in required
secrets, and run `docker compose up --build`. Compose applies pending Prisma
migrations with `prisma migrate deploy` before starting the app. Production
deployments outside Compose must run the same migration command against their
production database before starting the new app version. Configure a valid
Gmail App Password in `GMAIL_APP_PASSWORD` if email verification and invitations
must be delivered. The dedicated worker runs as a separate process and uses
PostgreSQL for AI, SLA, and email job recovery. Configure `SMTP_HOST` only for a
local or test SMTP server; otherwise Gmail SMTP remains the mail transport.

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js
- PostgreSQL database instance (e.g., Neon)
- Upstash Redis account (for rate limiting, caching, and pub/sub)
- Google Gemini API Key

### 1. Install Dependencies
```bash
bun install
```

### 2. Set Up Environment
Create a `.env` file in the root directory. You will need to configure your database, JWT secret, AI engine, Redis, and SMTP settings:

```env
# Database (e.g., Neon) - Note: Use connection_limit=10 for high concurrency
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require&connection_limit=10"

# Authentication
JWT_SECRET="your_super_secret_key"

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token"

# AI Integration
GEMINI_API_KEY="your_gemini_api_key"

# Email Configuration (Gmail SMTP)
# Use a Google App Password, not the account password.
GMAIL_USER="your_email@gmail.com"
GMAIL_APP_PASSWORD="your_16_character_app_password"
# Optional startup connectivity probe; defaults off so builds never contact SMTP.
SMTP_VERIFY_ON_STARTUP="false"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
Initialize the Prisma client and push the schema to your database:
```bash
bun x prisma generate
bun x prisma migrate deploy
```

### 4. Run the Development Server
```bash
bun dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 5. Run the Production Build (Recommended for Testing)
To truly experience the high-concurrency optimizations, build and start the production server:
```bash
bun run build
bun run start
```

---

## 📈 Load Testing
DevNexus includes a custom built-in load-testing suite to verify system stability and concurrency caps. With the production server running:

1. Ensure `JWT_SECRET` and `TEST_SDK_API_KEY` are set in your `.env` file.
2. Run the test:
```bash
npx tsx scripts/load-test.ts
```
This script will simulate 100 concurrent users accessing the landing page, requesting heavy database aggregations, ingesting SDK payloads, and maintaining open SSE connections.

---
<div align="center">
  <p>© 2026 DevNexus Team.</p>
</div>
