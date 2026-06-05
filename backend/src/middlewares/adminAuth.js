import { errorResponse } from '../utils/apiResponse.js';

/**
 * Admin-only route guard. Must be used after `protect`.
 */
export const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return errorResponse(res, 'Admin access required', 403, 'FORBIDDEN');
  }
  next();
};

/**
 * Admin or Moderator route guard.
 */
export const moderatorOrAdmin = (req, res, next) => {
  if (!req.user || !['ADMIN', 'MODERATOR'].includes(req.user.role)) {
    return errorResponse(res, 'Insufficient permissions', 403, 'FORBIDDEN');
  }
  next();
};
