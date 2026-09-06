import { PrismaClient } from '@devnexus/prisma-client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

/**
 * Safely append `statement_timeout` to the database URL using URLSearchParams
 * so we never produce a malformed connection string.
 */
function buildDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) return undefined;

  // Already has the param — don't duplicate it
  if (databaseUrl.includes("statement_timeout=")) return databaseUrl;

  try {
    const url = new URL(databaseUrl);
    url.searchParams.set("statement_timeout", "10000");
    return url.toString();
  } catch {
    // If the URL is not parseable (e.g. non-standard scheme), fall back to
    // simple concatenation as a last resort.
    return databaseUrl + (databaseUrl.includes("?") ? "&" : "?") + "statement_timeout=10000";
  }
}

const urlWithTimeout = buildDatabaseUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: urlWithTimeout
      ? { db: { url: urlWithTimeout } }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
