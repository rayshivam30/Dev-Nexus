<div align="center">
  <img src="https://via.placeholder.com/150/000000/FFFFFF/?text=DevNexus" alt="DevNexus Logo" width="120" height="120" />
  <h1>🚀 DevNexus: The Ultimate Developer Incident Platform</h1>
  <p><strong>A highly-scalable, AI-driven monorepo for capturing, analyzing, and resolving application errors in real-time.</strong></p>
</div>

---

## 📖 What is DevNexus?

DevNexus is an enterprise-grade incident management ecosystem. Rather than just reporting bugs, DevNexus actively acts as a virtual site-reliability engineer. 

By combining a lightweight client-side SDK with a massive-concurrency Node.js backend, it captures errors globally, analyzes them using Google's Gemini AI to find the root cause, and assigns the issue to the correct engineering team in real-time.

## 🗂️ Monorepo Structure

This repository is split into two primary components that work together seamlessly:

### 1. [The Incident Management System](./incident-management-system)
The core web application, dashboard, and API hub. Built to withstand massive concurrency spikes during application outages.
*   **Tech:** Next.js (App Router), Prisma, Upstash Redis, Tailwind CSS v4.
*   **Highlights:** 100+ concurrent user capability, Server-Sent Events (SSE) notification bridge, intelligent database connection multiplexing, and Throttled Task Queues (AI & Email).

### 2. [The Client SDK](./sdk)
A lightweight, zero-dependency tracking script that developers install in their own web applications to monitor errors.
*   **Tech:** Vanilla TypeScript.
*   **Highlights:** Automatically captures unhandled exceptions, Promise rejections, console errors, and environmental context (Browser, OS, URL) and streams them to the DevNexus API.

---

## ✨ Enterprise Features

*   **🤖 AI Root-Cause Analysis:** Integrates `gemini-2.0-flash` to automatically analyze incoming stack traces, suggest code fixes, and assign severity labels.
*   **⚡ High-Concurrency Ready:** Custom task queues and Redis-backed rate limiters ensure the API remains completely stable even if the SDK sends thousands of errors per minute.
*   **🏢 Multi-Tenant RBAC:** Isolated, role-specific dashboards for **Admins**, **Managers**, and **Developers**.
*   **🔗 GitHub Webhooks:** Automatically generates detailed issues in DevNexus when your CI/CD pipelines fail or PR checks error out.
*   **⏱️ SLA Tracking:** Automatically calculates response and resolution deadlines based on project pricing tiers and incident severity.

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
   bun x prisma db push
   bun dev
   ```

### Using the SDK
To start capturing errors from your own projects, navigate to the SDK directory and build the tracking script. See the [SDK Documentation](./sdk/README.md) for full implementation details.

---
<div align="center">
  <p>Built with ❤️ by the <strong>DevNexus Team</strong> | © 2026</p>
</div>
