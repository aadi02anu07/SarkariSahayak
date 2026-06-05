import prisma from '../config/db.js';
import { successResponse } from '../utils/apiResponse.js';

// Get paginated in-app notifications
export const getNotifications = async (req, res, next) => {
  try {
    const { cursor, limit = 20 } = req.query;
    const take = parseInt(limit) + 1;

    const where = { userId: req.user.id };
    if (cursor) where.id = { lt: cursor };

    const items = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take,
    });

    const hasMore = items.length > parseInt(limit);
    const data = hasMore ? items.slice(0, -1) : items;
    const nextCursor = hasMore ? data[data.length - 1].id : null;
    const unreadCount = await prisma.notification.count({ where: { userId: req.user.id, isRead: false } });

    return successResponse(res, { notifications: data, unreadCount, nextCursor }, 'Notifications fetched');
  } catch (err) { next(err); }
};

// Mark all as read
export const markAllRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { userId: req.user.id, isRead: false },
      data: { isRead: true },
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (err) { next(err); }
};

// Mark one as read
export const markOneRead = async (req, res, next) => {
  try {
    await prisma.notification.updateMany({
      where: { id: req.params.id, userId: req.user.id },
      data: { isRead: true },
    });
    return successResponse(res, null, 'Notification marked as read');
  } catch (err) { next(err); }
};

// Get notification preferences
export const getPreferences = async (req, res, next) => {
  try {
    const prefs = await prisma.notificationPref.findUnique({ where: { userId: req.user.id } });
    return successResponse(res, prefs, 'Notification preferences fetched');
  } catch (err) { next(err); }
};

// Update notification preferences
export const updatePreferences = async (req, res, next) => {
  try {
    const prefs = await prisma.notificationPref.upsert({
      where: { userId: req.user.id },
      update: req.body,
      create: { userId: req.user.id, ...req.body },
    });
    return successResponse(res, prefs, 'Preferences updated');
  } catch (err) { next(err); }
};
