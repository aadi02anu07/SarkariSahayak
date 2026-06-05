import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

const globalForPrisma = global;

const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? ['query', 'error', 'warn']
    : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Test connection on first import
prisma.$connect()
  .then(() => logger.info('✅ PostgreSQL connected via Prisma'))
  .catch((err) => {
    logger.error('❌ Prisma connection error:', err);
    process.exit(1);
  });

export default prisma;
