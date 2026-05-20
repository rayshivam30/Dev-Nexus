import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import crypto from 'crypto';

/**
 * Generates a random verification token.
 */
function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export async function registerAdmin(email: string, passwordPlain: string, orgName: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await hashPassword(passwordPlain);
  const verificationToken = generateToken();
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  // Increase interactive transaction timeout to avoid P2028 when operations take longer
  return await prisma.$transaction(
    async (tx: Prisma.TransactionClient) => {
    const org = await tx.organization.create({
      data: { name: orgName },
    });

    const user = await tx.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'UNVERIFIED', 
        orgId: org.id,
      },
    });

    await tx.verificationToken.create({
      data: {
        email,
        token: verificationToken,
        expiresAt,
      },
    });

    return { user, verificationToken };
  },
  { timeout: 30000 }
  );
}

export async function verifyEmail(token: string) {
  const vToken = await prisma.verificationToken.findUnique({
    where: { token }
  });

  if (!vToken || vToken.expiresAt < new Date()) {
    throw new Error('Invalid or expired verification token');
  }

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const user = await tx.user.update({
      where: { email: vToken.email },
      data: {
        status: 'ACTIVE',
        emailVerifiedAt: new Date(),
      }
    });

    await tx.verificationToken.delete({
      where: { token }
    });

    return user;
  });
}
