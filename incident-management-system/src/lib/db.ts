import { PrismaClient } from '@devnexus/prisma-client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const databaseUrl = process.env.DATABASE_URL;
const urlWithTimeout = databaseUrl
  ? (databaseUrl.includes("statement_timeout=")
    ? databaseUrl
    : databaseUrl + (databaseUrl.includes("?") ? "&" : "?") + "statement_timeout=10000")
  : undefined;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: urlWithTimeout
      ? { db: { url: urlWithTimeout } }
      : undefined,
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
