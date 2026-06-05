import cron from 'node-cron';
import { addDays, differenceInDays } from 'date-fns';
import prisma from '../config/db.js';
import emailQueue from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

/**
 * Deadline Detector — runs daily at 8:00 AM IST.
 * Finds active schemes closing in 1, 3, 7, or 30 days.
 * Enqueues deadline reminder emails for users who saved those schemes.
 */
export const startDeadlineDetector = () => {
  cron.schedule(
    '0 8 * * *',
    async () => {
      logger.info('🕐 Running deadline detector cron...');
      try {
        const now = new Date();
        const upcoming = await prisma.scheme.findMany({
          where: {
            status: 'ACTIVE',
            closeDate: {
              gte: now,
              lte: addDays(now, 31),
            },
            isRolling: false,
          },
          select: { id: true, name: true, closeDate: true },
        });

        let emailsQueued = 0;

        for (const scheme of upcoming) {
          const daysLeft = differenceInDays(new Date(scheme.closeDate), now);
          if (![1, 3, 7, 30].includes(daysLeft)) continue;

          const savedUsers = await prisma.savedScheme.findMany({
            where: {
              schemeId: scheme.id,
              status: { in: ['SAVED', 'INTERESTED'] },
              user: {
                notificationPrefs: { deadlineReminder: true },
              },
            },
            include: { user: { select: { id: true } } },
          });

          for (const { user } of savedUsers) {
            await emailQueue.add('send-deadline-reminder', {
              userId: user.id,
              schemeId: scheme.id,
              daysLeft,
            });
            emailsQueued++;
          }
        }

        logger.info(`✅ Deadline detector: ${emailsQueued} reminder(s) queued`);
      } catch (err) {
        logger.error('Deadline detector error:', err.message);
      }
    },
    { timezone: 'Asia/Kolkata' }
  );

  logger.info('✅ Deadline detector cron scheduled (daily 8AM IST)');
};
