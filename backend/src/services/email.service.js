import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_APP_PASSWORD,
  },
});

// Verify transporter on startup
transporter.verify((error) => {
  if (error) {
    logger.warn('⚠️  Email transporter verification failed:', error.message);
  } else {
    logger.info('✅ Email transporter ready');
  }
});

/**
 * Send an email.
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML body
 * @param {string} [options.text] - Plain text fallback
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  const info = await transporter.sendMail({
    from: `"SarkariSahayak 🇮🇳" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
    text,
  });
  logger.info(`Email sent to ${to}: ${info.messageId}`);
  return info;
};
