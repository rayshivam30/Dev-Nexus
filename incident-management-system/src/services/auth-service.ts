import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { hashPassword } from '@/lib/hash';

export async function registerAdmin(email: string, passwordPlain: string, orgName: string) {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new Error('Email already in use');
  }

  const hashedPassword = await hashPassword(passwordPlain);

  return await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const org = await tx.organization.create({
      data: { name: orgName },
    });

    return tx.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: 'ADMIN',
        status: 'ACTIVE', 
        orgId: org.id,
      },
    });
  });
}
