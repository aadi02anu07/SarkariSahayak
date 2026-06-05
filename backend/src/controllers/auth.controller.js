import passport from '../config/passport.js';
import * as authService from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/apiResponse.js';
import { logger } from '../utils/logger.js';

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const register = async (req, res, next) => {
  try {
    const user = await authService.registerUser(req.body);
    return successResponse(res, user, 'Registration successful. Please check your email for OTP.', 201);
  } catch (err) {
    next(err);
  }
};

export const verifyEmail = async (req, res, next) => {
  try {
    const user = await authService.verifyEmailOtp(req.body.email, req.body.otp);
    return successResponse(res, user, 'Email verified successfully');
  } catch (err) {
    next(err);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.loginUser(req.body);
    return successResponse(res, result, 'Login successful');
  } catch (err) {
    next(err);
  }
};

export const logout = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    await authService.logoutUser(refreshToken);
    return successResponse(res, null, 'Logged out successfully');
  } catch (err) {
    next(err);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return errorResponse(res, 'Refresh token required', 400);
    const tokens = await authService.refreshAccessToken(refreshToken);
    return successResponse(res, tokens, 'Tokens refreshed');
  } catch (err) {
    next(err);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    await authService.forgotPassword(req.body.email);
    // Always return success to prevent email enumeration
    return successResponse(res, null, 'If that email is registered, a reset link has been sent.');
  } catch (err) {
    next(err);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    return successResponse(res, null, 'Password reset successful. Please log in with your new password.');
  } catch (err) {
    next(err);
  }
};

// Google OAuth — redirect to Google
export const googleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  session: false,
});

// Google OAuth callback — Passport populates req.user
export const googleCallback = [
  passport.authenticate('google', { session: false, failureRedirect: `${FRONTEND_URL}/login?error=oauth_failed` }),
  async (req, res, next) => {
    try {
      const result = await authService.googleAuthCallback(req.user);
      // Redirect to frontend with tokens in query params (frontend stores them)
      const params = new URLSearchParams({
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
      return res.redirect(`${FRONTEND_URL}/oauth/callback?${params.toString()}`);
    } catch (err) {
      next(err);
    }
  },
];
