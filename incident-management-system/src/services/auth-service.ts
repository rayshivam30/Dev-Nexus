import { Prisma } from '@devnexus/prisma-client';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/hash';
import crypto from 'crypto';


export async function registerAdmin(email: string, passwordPlain: string, orgName: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await hashPassword(passwordPlain);
  // Generate a raw token to send in the email; store only its SHA-256 hash
  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
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
        token: hashedToken,
        expiresAt,
      },
    });

    return { user, verificationToken: rawToken };
  },
  { timeout: 30000 }
  );
}

export async function verifyEmail(token: string) {
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  const vToken = await prisma.verificationToken.findUnique({
    where: { token: hashedToken }
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
      where: { token: hashedToken }
    });

    return user;
  });
}
