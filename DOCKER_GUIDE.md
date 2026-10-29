# 🐳 DevNexus — Complete Local Docker Setup Guide

This guide walks you through running the **entire DevNexus system** (PostgreSQL Database, Schema Migrations, Next.js Web App, and the Background Worker) locally using Docker Compose.

---

## 🏗️ Architecture Overview

When you run Docker Compose, it orchestrates four dedicated services defined in `docker-compose.yml`:

```mermaid
graph TD
    subgraph Docker Network [devnexus-network]
        PG[(PostgreSQL 16\nport 5432)]
        MIG[Migrations Init Container\nBun + Prisma]
        REDIS[(Redis 7\nport 6379)]
        SRH[Serverless Redis HTTP\nport 8080]
        MAIL[Mailpit Local SMTP\nport 1025 / UI 8025]
        APP[DevNexus Web App\nNext.js 16 - port 3000]
        WORKER[Background Worker\nAI, SLA & Email Queues]
    end

    GEMINI[(Google Gemini API)]

    PG -->|Healthy| MIG
    REDIS -->|Healthy| SRH
    MIG -->|Completed| APP
    MIG -->|Completed| WORKER
    PG <--> APP
    PG <--> WORKER
    APP <--> SRH
    WORKER <--> SRH
    APP --> MAIL
    WORKER --> MAIL
    WORKER <--> GEMINI
```

| Service | Container Name | Description |
| :--- | :--- | :--- |
| **`postgres`** | `devnexus-db` | Isolated PostgreSQL 16 Alpine instance with persistent volume `postgres_data`. |
| **`migrations`** | `devnexus-migrations` | Runs `bun x prisma migrate deploy` upon DB startup, then exits cleanly. |
| **`redis`** | `devnexus-redis` | Local Redis 7 in-memory cache and rate-limiter store. |
| **`redis-http`** | `devnexus-redis-http` | Official Upstash HTTP-to-Redis proxy for `@upstash/redis` without cloud accounts. |
| **`mailpit`** | `devnexus-mailpit` | Local SMTP test server & Webmail UI at `http://localhost:8025`. Captures all emails locally. |
| **`app`** | `devnexus-app` | Production-optimized Next.js standalone server serving UI & APIs on `http://localhost:3000`. |
| **`worker`** | `devnexus-worker` | Long-running process executing `bun run src/worker.ts` (AI triage, SLA sweeps, emails). |

---

## 📋 Prerequisites

1. **Docker Desktop for Windows**:
   - Ensure Docker Desktop is installed and **running** (the whale icon in your system tray should be steady green).
   - WSL2 backend enabled (default in modern Docker Desktop).

---

## ⚙️ Step 1: Create the Root `.env` File

Docker Compose requires environment variables at the root of the repository.

Create a file named `.env` in the root folder (`DevNexus/.env`) with the following content:

```env
# ── 1. Local Database (PostgreSQL) ───────────────────────────────────────────
POSTGRES_PASSWORD="devnexus_local_password_123"

# ── 2. Authentication ────────────────────────────────────────────────────────
# Secret key for JWT signing (minimum 32 characters)
JWT_SECRET="8f3b9c2e1d7a4f6b8e5c0a9d3f1b7e6c2a4d8f9b1c3e7a5d6f2c9b8e1a4d7c3"

# ── 3. Security & Telemetry ──────────────────────────────────────────────────
# Webhook secret configured for GitHub App integrations
GITHUB_WEBHOOK_SECRET="Shivam@00"

# Passcode to protect the /api/metrics Prometheus endpoint
METRICS_BEARER_TOKEN="devnexus_metrics_token_local_98765"

# ── 4. Local Redis (Docker Container) ─────────────────────────────────────────
# Automatically connects to the local Redis container via serverless-redis-http proxy
UPSTASH_REDIS_REST_URL="http://redis-http:80"
UPSTASH_REDIS_REST_TOKEN="devnexus_local_redis_token"

# ── 5. Local Email Delivery (Mailpit Container) ──────────────────────────────
# All outgoing emails are caught locally. View inbox at http://localhost:8025
SMTP_HOST="mailpit"
SMTP_PORT="1025"
SMTP_SECURE="false"
SMTP_VERIFY_ON_STARTUP="false"

# Optional: Real Gmail Delivery Override
# SMTP_HOST=""
# GMAIL_USER="your-email@gmail.com"
# GMAIL_APP_PASSWORD="your-app-password"

# ── 6. AI Services (Optional) ────────────────────────────────────────────────
# Google Gemini API key for incident root-cause analysis & resolution tips
GEMINI_API_KEY="AIzaSyDtO0pI-m4mPQhFNarFrDSmF9CwyjmvPbg"

# ── 7. URLs & GitHub App ─────────────────────────────────────────────────────
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXT_PUBLIC_GITHUB_APP_SLUG="devnexus-monitor"
GITHUB_APP_ID="3509139"
GITHUB_CLIENT_ID="Iv23liKZaWV8VoWhmPHh"
GITHUB_CLIENT_SECRET="e5dc7390e5ebc9fa1cb4dafebd14b6a3df8d5314"
```

---

## 🚀 Step 2: Start the System

Open a terminal (PowerShell or Bash) in the repository root (`DevNexus`) and run:

```bash
docker compose up --build
```

### To Run in the Background (Detached Mode):
```bash
docker compose up -d --build
```

Docker will:
1. Pull PostgreSQL 16, Redis 7, Serverless Redis HTTP proxy, and Mailpit images.
2. Build the multi-stage Dockerfile for Next.js web app (`runner`) and background worker (`worker`).
3. Automatically apply Prisma migrations.
4. Launch all 7 containers on `devnexus-network`.

---

## 🔍 Step 3: Access & Verification

- **Web Dashboard**: Open [http://localhost:3000](http://localhost:3000)
- **Local Mailbox (Mailpit)**: Open [http://localhost:8025](http://localhost:8025) *(instant email verification without real email credentials)*
- **Database Connection (Local Host)**: `postgresql://devnexus:devnexus_local_password_123@localhost:5432/devnexus`
- **Redis Connection (Local Host)**: `redis://localhost:6379`
- **Metrics Endpoint**: [http://localhost:3000/api/metrics](http://localhost:3000/api/metrics)  
  *(Send header `Authorization: Bearer devnexus_metrics_token_local_98765`)*

---

## 🛠️ Handy Docker Commands

### View Logs
```bash
# View combined logs in real-time
docker compose logs -f

# View only background worker logs (AI / SLA / Email processing)
docker compose logs -f worker

# View web app logs
docker compose logs -f app

# View database logs
docker compose logs -f postgres
```

### Check Container Status
```bash
docker compose ps
```

### Stop the System
```bash
# Stop containers without deleting data
docker compose down

# Stop and wipe database volume (clean reset)
docker compose down -v
```

### Execute Prisma Commands Inside the Container
```bash
# Open Prisma Studio to inspect tables and data visually
docker compose exec app bun x prisma studio

# Run a manual migration check
docker compose exec app bun x prisma migrate status
```

---

## ⚠️ Troubleshooting

1. **Error: `failed to connect to the docker API at npipe:////./pipe/dockerDesktopLinuxEngine`**  
   - Docker Desktop is not running. Launch the **Docker Desktop** application from your Windows Start menu and wait for the engine to initialize.

2. **Port 5432 or 3000 Conflict**  
   - If you have a local PostgreSQL or Node process running outside Docker on port `5432` or `3000`, stop that service first or modify the port mapping in `docker-compose.yml`.

3. **`METRICS_BEARER_TOKEN: required in production`**  
   - Ensure `METRICS_BEARER_TOKEN` is present in your root `.env` file. Any random string works.
