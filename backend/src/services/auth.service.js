import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../config/db.js';
import emailQueue from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

const SALT_ROUNDS = 12;
const OTP_EXPIRY_MINUTES = 10;
const RESET_TOKEN_EXPIRY_HOURS = 1;

/**
 * Generate a JWT access token (15 min expiry).
 */
export const generateAccessToken = (userId, role) => {
  return jwt.sign(
    { sub: userId, role },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

/**
 * Generate a JWT refresh token (7 day expiry).
 */
export const generateRefreshToken = (userId) => {
  return jwt.sign(
    { sub: userId },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRY || '7d' }
  );
};

/**
 * Hash a token for DB storage.
 */
export const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Register a new user.
 */
export const registerUser = async ({ name, email, password }) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    const error = new Error('Email already registered');
    error.statusCode = 409;
    error.code = 'EMAIL_EXISTS';
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpHash = hashToken(otp);
  const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      // Store OTP temporarily in refresh tokens table with a special identifier
      profile: { create: {} },
      notificationPrefs: { create: {} },
    },
    select: { id: true, name: true, email: true, role: true, isVerified: true },
  });

  // Store OTP in Redis (10 min TTL)
  const { default: redis } = await import('../config/redis.js');
  await redis.setex(`otp:verify:${email}`, OTP_EXPIRY_MINUTES * 60, otpHash);

  // Enqueue verification email
  await emailQueue.add('send-email-verify', { email, name, otp });

  logger.info(`New user registered: ${email}`);
  return user;
};

/**
 * Verify email with OTP.
 */
export const verifyEmailOtp = async (email, otp) => {
  const { default: redis } = await import('../config/redis.js');
  const storedHash = await redis.get(`otp:verify:${email}`);

  if (!storedHash || storedHash !== hashToken(otp)) {
    const error = new Error('Invalid or expired OTP');
    error.statusCode = 400;
    error.code = 'INVALID_OTP';
    throw error;
  }

  const user = await prisma.user.update({
    where: { email },
    data: { isVerified: true },
    select: { id: true, name: true, email: true, role: true },
  });

  await redis.del(`otp:verify:${email}`);
  await emailQueue.add('send-welcome', { userId: user.id });

  return user;
};

/**
 * Login with email and password.
 */
export const loginUser = async ({ email, password }) => {
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !user.passwordHash) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    const error = new Error('Invalid email or password');
    error.statusCode = 401;
    error.code = 'INVALID_CREDENTIALS';
    throw error;
  }

  if (!user.isVerified) {
    const error = new Error('Please verify your email before logging in');
    error.statusCode = 403;
    error.code = 'EMAIL_NOT_VERIFIED';
    throw error;
  }

  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  // Store hashed refresh token in DB
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  logger.info(`User logged in: ${email}`);
  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isPremium: user.isPremium,
    },
  };
};

/**
 * Refresh access token using a valid refresh token.
 */
export const refreshAccessToken = async (refreshToken) => {
  let decoded;
  try {
    decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    const error = new Error('Invalid or expired refresh token');
    error.statusCode = 401;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  const tokenHash = hashToken(refreshToken);
  const stored = await prisma.refreshToken.findFirst({
    where: {
      userId: decoded.sub,
      tokenHash,
      expiresAt: { gt: new Date() },
    },
  });

  if (!stored) {
    const error = new Error('Refresh token not found or expired');
    error.statusCode = 401;
    error.code = 'INVALID_REFRESH_TOKEN';
    throw error;
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user) throw new Error('User not found');

  // Rotate: delete old, issue new
  await prisma.refreshToken.delete({ where: { id: stored.id } });

  const newAccessToken = generateAccessToken(user.id, user.role);
  const newRefreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(newRefreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * Logout — delete refresh token.
 */
export const logoutUser = async (refreshToken) => {
  const tokenHash = hashToken(refreshToken);
  await prisma.refreshToken.deleteMany({ where: { tokenHash } });
};

/**
 * Initiate forgot password flow.
 */
export const forgotPassword = async (email) => {
  const user = await prisma.user.findUnique({ where: { email } });
  // Always return success to prevent email enumeration
  if (!user) return;

  const token = crypto.randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);

  const { default: redis } = await import('../config/redis.js');
  await redis.setex(
    `reset:${tokenHash}`,
    RESET_TOKEN_EXPIRY_HOURS * 60 * 60,
    user.id
  );

  await emailQueue.add('send-password-reset', {
    email: user.email,
    name: user.name,
    token,
  });

  logger.info(`Password reset requested for: ${email}`);
};

/**
 * Reset password with token.
 */
export const resetPassword = async (token, newPassword) => {
  const tokenHash = hashToken(token);
  const { default: redis } = await import('../config/redis.js');
  const userId = await redis.get(`reset:${tokenHash}`);

  if (!userId) {
    const error = new Error('Invalid or expired reset token');
    error.statusCode = 400;
    error.code = 'INVALID_RESET_TOKEN';
    throw error;
  }

  const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  // Invalidate all refresh tokens for this user
  await prisma.refreshToken.deleteMany({ where: { userId } });
  await redis.del(`reset:${tokenHash}`);

  logger.info(`Password reset for user: ${userId}`);
};

/**
 * Process Google OAuth login/signup.
 * Called by Passport after successful OAuth.
 */
export const googleAuthCallback = async (user) => {
  const accessToken = generateAccessToken(user.id, user.role);
  const refreshToken = generateRefreshToken(user.id);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken, user };
};
