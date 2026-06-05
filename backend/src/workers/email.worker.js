import { Worker } from 'bullmq';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import redis from '../config/redis.js';
import { sendEmail } from '../services/email.service.js';
import prisma from '../config/db.js';
import { logger } from '../utils/logger.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

/**
 * Load an email HTML template and replace {{variable}} placeholders.
 */
const renderTemplate = (templateName, variables) => {
  const templatePath = join(__dirname, '../templates/emails', `${templateName}.html`);
  let html = readFileSync(templatePath, 'utf-8');
  for (const [key, value] of Object.entries(variables)) {
    html = html.replace(new RegExp(`{{${key}}}`, 'g'), String(value ?? ''));
  }
  return html;
};

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const emailWorker = new Worker(
  'email',
  async (job) => {
    const { name, data } = job;
    logger.info(`Processing email job: ${name} (id: ${job.id})`);

    switch (name) {
      case 'send-welcome': {
        const { userId } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) throw new Error(`User ${userId} not found`);

        const html = renderTemplate('welcome', {
          name: user.name || 'there',
          dashboardUrl: `${FRONTEND_URL}/dashboard`,
        });

        await sendEmail({
          to: user.email,
          subject: '🎉 Welcome to SarkariSahayak!',
          html,
        });
        break;
      }

      case 'send-email-verify': {
        const { email, name, otp } = data;
        const html = renderTemplate('email-verify', { name: name || 'User', otp });
        await sendEmail({
          to: email,
          subject: `${otp} — Verify your SarkariSahayak email`,
          html,
        });
        break;
      }

      case 'send-password-reset': {
        const { email, name, token } = data;
        const resetUrl = `${FRONTEND_URL}/reset-password?token=${token}`;
        const html = renderTemplate('password-reset', {
          name: name || 'User',
          resetUrl,
        });
        await sendEmail({
          to: email,
          subject: '🔑 Reset your SarkariSahayak password',
          html,
        });
        break;
      }

      case 'send-deadline-reminder': {
        const { userId, schemeId, daysLeft } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        const scheme = await prisma.scheme.findUnique({ where: { id: schemeId } });

        if (!user || !scheme) {
          logger.warn(`Deadline reminder skipped: user=${userId}, scheme=${schemeId}`);
          break;
        }

        const closeDate = scheme.closeDate
          ? new Date(scheme.closeDate).toLocaleDateString('en-IN', {
              day: 'numeric', month: 'long', year: 'numeric',
            })
          : 'N/A';

        const html = renderTemplate('deadline-reminder', {
          userName: user.name || 'there',
          schemeName: scheme.name,
          daysLeft,
          closeDate,
          benefitAmount: scheme.benefitAmount || 'See official portal',
          ministry: scheme.ministry || 'Government of India',
          applyUrl: scheme.applyUrl || '#',
          preferencesUrl: `${FRONTEND_URL}/notifications`,
        });

        await sendEmail({
          to: user.email,
          subject: `⏰ ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left to apply — ${scheme.name}`,
          html,
        });

        // Also create in-app notification
        await prisma.notification.create({
          data: {
            userId,
            type: 'DEADLINE_REMINDER',
            title: `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left: ${scheme.name}`,
            message: `The application deadline for "${scheme.name}" is on ${closeDate}. Apply now!`,
            schemeId,
            sentVia: ['EMAIL', 'IN_APP'],
          },
        });
        break;
      }

      case 'send-new-scheme-alert': {
        const { userId, schemeIds } = data;
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) break;

        const schemes = await prisma.scheme.findMany({
          where: { id: { in: schemeIds } },
          select: { id: true, name: true, benefitType: true, slug: true },
        });

        if (!schemes.length) break;

        const schemeListHtml = schemes
          .map((s) => `<li><a href="${FRONTEND_URL}/schemes/${s.slug}">${s.name}</a> (${s.benefitType})</li>`)
          .join('');

        const html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #FF6B35;">🆕 New schemes matching your profile!</h2>
            <p>Hi <strong>${user.name || 'there'}</strong>, we found ${schemes.length} new scheme(s) for you:</p>
            <ul>${schemeListHtml}</ul>
            <p><a href="${FRONTEND_URL}/eligibility" style="background: #FF6B35; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View All Matches</a></p>
            <hr><p style="color: #999; font-size: 12px;">SarkariSahayak is not affiliated with any government body.</p>
          </div>
        `;

        await sendEmail({
          to: user.email,
          subject: `🆕 ${schemes.length} new scheme(s) match your profile`,
          html,
        });
        break;
      }

      default:
        logger.warn(`Unknown email job type: ${name}`);
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

emailWorker.on('completed', (job) => {
  logger.info(`Email job ${job.id} (${job.name}) completed`);
});

emailWorker.on('failed', (job, err) => {
  logger.error(`Email job ${job?.id} (${job?.name}) failed:`, err.message);
});

export default emailWorker;
