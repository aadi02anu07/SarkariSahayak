import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

const createLimiter = (options) =>
  rateLimit({
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Rate limit exceeded: ${req.ip} on ${req.path}`);
      res.status(429).json({
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: options.message || 'Too many requests. Please try again later.',
        },
      });
    },
    ...options,
  });

/**
 * General API rate limiter — 100 requests per 15 minutes.
 */
export const generalLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests, please try again in 15 minutes.',
});

/**
 * Auth endpoint limiter — 10 attempts per 15 minutes.
 * Protects login, register, forgot-password.
 */
export const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Too many authentication attempts, please try again in 15 minutes.',
});

/**
 * Strict limiter for sensitive endpoints — 5 per hour.
 * Used on password reset, email verify.
 */
export const strictLimiter = createLimiter({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: 'Too many requests for this action. Please try again in an hour.',
});
