import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    // Connection pool tuned for 100 concurrent users on Neon PostgreSQL.
    // Neon free-tier allows ~20 direct connections; using their pooler endpoint
    // (configured in DATABASE_URL) lets us push higher.
    // pool_timeout: time (seconds) a request waits for a free connection before P2024.
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
