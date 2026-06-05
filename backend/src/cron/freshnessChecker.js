import cron from 'node-cron';
import { subDays } from 'date-fns';
import prisma from '../config/db.js';
import emailQueue from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

/**
 * Freshness Checker — runs every Monday at 9:00 AM IST.
 * - Flags schemes not verified in 90 days as NEEDS_VERIFICATION
 * - Hides (PAUSED) schemes not verified in 180 days
 * - Alerts admins about stale count
 */
export const startFreshnessChecker = () => {
  cron.schedule(
    '0 9 * * 1',
    async () => {
      logger.info('🕐 Running freshness checker cron...');
      try {
        const ninetyDaysAgo = subDays(new Date(), 90);
        const oneEightyDaysAgo = subDays(new Date(), 180);

        // Hide at 180 days (run first to avoid double-processing)
        const hidden = await prisma.scheme.updateMany({
          where: {
            status: { in: ['ACTIVE', 'NEEDS_VERIFICATION'] },
            lastVerified: { lt: oneEightyDaysAgo },
          },
          data: { status: 'PAUSED' },
        });

        // Flag at 90 days
        const flagged = await prisma.scheme.updateMany({
          where: {
            status: 'ACTIVE',
            lastVerified: { lt: ninetyDaysAgo },
          },
          data: { status: 'NEEDS_VERIFICATION' },
        });

        const staleCount = await prisma.scheme.count({
          where: { status: 'NEEDS_VERIFICATION' },
        });

        logger.info(
          `✅ Freshness checker: ${flagged.count} flagged, ${hidden.count} hidden, ${staleCount} total stale`
        );

        if (staleCount > 0) {
          // Notify admin users
          const admins = await prisma.user.findMany({
            where: { role: 'ADMIN' },
            select: { email: true, name: true },
          });

          for (const admin of admins) {
            await emailQueue.add('send-stale-alert', {
              email: admin.email,
              name: admin.name,
              staleCount,
            });
          }
        }
      } catch (err) {
        logger.error('Freshness checker error:', err.message);
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  logger.info('✅ Freshness checker cron scheduled (Monday 9AM IST)');
};
