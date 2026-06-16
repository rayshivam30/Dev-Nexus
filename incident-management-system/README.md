<div align="center">
  <h1>🚨 DevNexus Incident Management System</h1>
  <p>An enterprise-grade, high-concurrency platform for real-time error tracking, AI-powered root cause analysis, and automated developer workflows.</p>
</div>

---

## 🌟 Overview

DevNexus is a state-of-the-art incident management platform designed to handle massive concurrency without breaking a sweat. It ingests errors from client SDKs and GitHub webhooks, analyzes them instantly using Google's Gemini AI, and routes them to the appropriate developer teams in real-time via Server-Sent Events (SSE).

Built with **Next.js (App Router)**, **TypeScript**, **Prisma**, **Upstash Redis**, and **Gemini AI**, the platform uses robust event-driven architecture, internal task queues, and intelligent connection pooling to reliably support high-throughput production loads.

## 🚀 Key Features

*   **⚡ High-Concurrency Architecture:** Hardened with Redis-backed event bridges, database connection multiplexing, and in-memory rate limiting to smoothly handle 100+ concurrent users and massive error spikes.
*   **🤖 AI-Powered Analysis:** Integrates `gemini-2.0-flash` with a custom throttled queue system (15 RPM limit) to automatically analyze errors, suggest fixes, and determine root causes without dropping requests.
*   **📡 Real-Time Notifications:** Uses optimized Server-Sent Events (SSE) with connection capping and automatic memory cleanup to deliver instant alerts to developer dashboards.
*   **🏢 Multi-Tenant RBAC:** Complete Role-Based Access Control isolating environments for **Admins** (organization oversight), **Managers** (project management), and **Developers** (issue resolution).
*   **📧 Throttled Email Queue:** Batches automated assignment and alert emails (via SMTP) to prevent spam blocks and ensure deliverability during major outages.
*   **🔗 GitHub Integration:** Seamlessly connects with GitHub repositories via webhooks to track CI/CD deployments and automatically generate issues from pipeline failures.

## 🏗️ Architecture

- **Frontend/Backend:** Next.js 16 (App Router) & React 19
- **Database:** PostgreSQL (Neon) managed by Prisma ORM
- **Event Bus & Caching:** Upstash Redis (REST API)
- **AI Engine:** Google Gemini SDK
- **Styling:** Tailwind CSS, Framer Motion, and Lucide Icons

---

## 🛠️ Getting Started

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

# Email Configuration (SMTP)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_app_password"
SMTP_FROM="your_email@gmail.com"

# Application URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 3. Database Setup
Initialize the Prisma client and push the schema to your database:
```bash
bun x prisma generate
bun x prisma db push
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
