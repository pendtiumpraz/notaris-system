import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

// Use PRISMA_DATABASE_URL for Accelerate, fallback to DATABASE_URL
const accelerateUrl = process.env.PRISMA_DATABASE_URL || process.env.DATABASE_URL;

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
    ...(accelerateUrl?.startsWith('prisma+') ? { accelerateUrl } : {}),
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
