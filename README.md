<div align="center">
  <img src="https://via.placeholder.com/150/000000/FFFFFF/?text=DevNexus" alt="DevNexus Logo" width="120" height="120" />
  <h1>🚀 DevNexus: Incident Inbox for Engineering Teams</h1>
  <p><strong>A small-team incident inbox for capturing, grouping, and resolving application errors.</strong></p>
</div>

---

## 📖 What is DevNexus?

DevNexus is an incident inbox for small engineering teams. It receives SDK and GitHub reports, groups matching SDK events, and provides issue triage and analysis tools.

The platform combines a TypeScript SDK with a Next.js and PostgreSQL application. AI analysis is queued by the server when configured; routing and assignment remain explicit product workflows.

## 🗂️ Monorepo Structure

This repository is split into two primary components that work together seamlessly:

### 1. [The Incident Management System](./incident-management-system)
The core web application, dashboard, and API hub.
*   **Tech:** Next.js (App Router), Prisma, Upstash Redis, Tailwind CSS v4.
*   **Highlights:** SDK and GitHub ingestion, issue grouping, Server-Sent Events (SSE) notifications, and queued AI analysis.

### 2. [The Client SDK](./sdk)
A lightweight, zero-dependency tracking script that developers install in their own web applications to monitor errors.
*   **Tech:** Vanilla TypeScript.
*   **Highlights:** Automatically captures unhandled exceptions, Promise rejections, console errors, and environmental context (Browser, OS, URL) and streams them to the DevNexus API.

---

## ✨ Enterprise Features

*   **🤖 AI-Assisted Analysis:** Uses the configured Gemini model to analyze queued issue data and suggest fixes.
*   **⚡ Ingestion Controls:** SDK ingestion uses payload limits and rate limiting; capacity depends on deployment and its database/Redis configuration.
*   **🏢 Multi-Tenant RBAC:** Isolated, role-specific dashboards for **Admins**, **Managers**, and **Developers**.
*   **🔗 GitHub Webhooks:** Automatically generates detailed issues in DevNexus when your CI/CD pipelines fail or PR checks error out.
*   **⏱️ SLA Tracking:** Eligible plans receive severity-based response and resolution deadlines, with background breach notifications.

---

## 🛠️ Quick Start Guide

### Prerequisites
- [Bun](https://bun.sh/) (recommended) or Node.js (v18+)
- PostgreSQL Database (e.g., Neon)
- Upstash Redis Account
- Google Gemini API Key

### Launching the Management Platform
1. Navigate to the core system:
   ```bash
   cd incident-management-system
   ```
2. Install dependencies:
   ```bash
   bun install
   ```
3. Set up your `.env` file (refer to the [System README](./incident-management-system/README.md) for required keys).
4. Deploy the database schema and start the system:
   ```bash
   bun x prisma migrate deploy
   bun dev
   ```
5. Start the background worker in a second terminal:
   ```bash
   bun run worker
   ```

### Using the SDK
To start capturing errors from your own projects, navigate to the SDK directory and build the tracking script. See the [SDK Documentation](./sdk/README.md) for full implementation details.

---
<div align="center">
  <p>Built with ❤️ by the <strong>DevNexus Team</strong> | © 2026</p>
</div>
