# ─────────────────────────────────────────────────────────────────────────────
# DevNexus Incident Management System — Multi-Stage Docker Build
# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: base        — Shared Node.js + Bun runtime
# Stage 2: deps        — Install ALL dependencies (dev + prod)
# Stage 3: builder     — Build the Next.js application
# Stage 4: runner      — Minimal production image (~120 MB)
# ─────────────────────────────────────────────────────────────────────────────

# ── Stage 1: Base ────────────────────────────────────────────────────────────
FROM node:20-alpine AS base

# Install system deps needed by Prisma and sharp
RUN apk add --no-cache libc6-compat openssl

# Copy bun from the official bun alpine image (fixes npm hanging on Windows)
COPY --from=oven/bun:1-alpine /usr/local/bin/bun /usr/local/bin/bun

WORKDIR /app

# ── Stage 2: Dependencies ───────────────────────────────────────────────────
FROM base AS deps

COPY package.json bun.lock bunfig.toml ./
COPY prisma ./prisma/

# Install all dependencies (including devDependencies for the build stage)
RUN bun install --frozen-lockfile

# Generate the Prisma Client
RUN bun x prisma generate

# ── Stage 3: Builder ────────────────────────────────────────────────────────
FROM base AS builder

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Set build-time env vars (these are baked into the Next.js bundle)
# NEXT_PUBLIC_* vars must be available at build time
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GITHUB_APP_SLUG
ENV NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL}
ENV NEXT_PUBLIC_GITHUB_APP_SLUG=${NEXT_PUBLIC_GITHUB_APP_SLUG}

# Disable Next.js telemetry during build
ENV NEXT_TELEMETRY_DISABLED=1

# Build the application
RUN bun run build

# ── Stage 4: Runner (Production) ────────────────────────────────────────────
FROM node:20-alpine AS runner

# Install system deps needed at runtime
RUN apk add --no-cache libc6-compat openssl curl

WORKDIR /app

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy built output from builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

# Automatically leverage output traces to reduce image size
# https://nextjs.org/docs/advanced-features/output-file-tracing
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy node_modules for Prisma runtime (needed for prisma client)
COPY --from=deps /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=deps /app/node_modules/@prisma ./node_modules/@prisma

# Set runtime environment
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check — hit the Next.js health endpoint
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000/ || exit 1

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Start the server using the standalone output
CMD ["node", "server.js"]
