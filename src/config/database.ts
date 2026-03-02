import { PrismaClient } from '@prisma/client';
import { env } from './env';

declare global {
  var __prisma: PrismaClient | undefined;
}

function makePrismaClient() {
  return new PrismaClient({
    log: env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['warn', 'error'],
  });
}

export const prisma: PrismaClient =
  env.NODE_ENV === 'production'
    ? makePrismaClient()
    : (global.__prisma ?? (global.__prisma = makePrismaClient()));

export async function disconnectPrisma() {
  await prisma.$disconnect();
}
