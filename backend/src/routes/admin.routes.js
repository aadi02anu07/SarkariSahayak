import { Router } from 'express';
import { protect } from '../middlewares/auth.js';
import { adminOnly } from '../middlewares/adminAuth.js';
import { validate } from '../middlewares/validate.js';
import { createSchemeSchema, updateSchemeSchema } from '../validations/scheme.schema.js';
import * as schemeService from '../services/scheme.service.js';
import { successResponse } from '../utils/apiResponse.js';
import prisma from '../config/db.js';

const router = Router();
router.use(protect, adminOnly);

// Scheme management
router.get('/schemes', async (req, res, next) => {
  try {
    const schemes = await prisma.scheme.findMany({
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit) || 50,
    });
    return successResponse(res, schemes, 'All schemes fetched');
  } catch (err) { next(err); }
});

router.post('/schemes', validate(createSchemeSchema), async (req, res, next) => {
  try {
    const scheme = await schemeService.createScheme(req.body, req.user.id);
    return successResponse(res, scheme, 'Scheme created', 201);
  } catch (err) { next(err); }
});

router.patch('/schemes/:id', validate(updateSchemeSchema), async (req, res, next) => {
  try {
    const scheme = await schemeService.updateScheme(req.params.id, req.body);
    return successResponse(res, scheme, 'Scheme updated');
  } catch (err) { next(err); }
});

router.delete('/schemes/:id', async (req, res, next) => {
  try {
    await schemeService.deleteScheme(req.params.id);
    return successResponse(res, null, 'Scheme deleted');
  } catch (err) { next(err); }
});

router.patch('/schemes/:id/publish', async (req, res, next) => {
  try {
    const scheme = await schemeService.publishScheme(req.params.id);
    return successResponse(res, scheme, 'Scheme published');
  } catch (err) { next(err); }
});

// User management
router.get('/users', async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, isPremium: true, isVerified: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: parseInt(req.query.limit) || 50,
    });
    return successResponse(res, users, 'Users fetched');
  } catch (err) { next(err); }
});

// Analytics
router.get('/analytics', async (req, res, next) => {
  try {
    const [totalUsers, totalSchemes, totalSaved, activeSchemes, premiumUsers] = await Promise.all([
      prisma.user.count(),
      prisma.scheme.count(),
      prisma.savedScheme.count(),
      prisma.scheme.count({ where: { status: 'ACTIVE' } }),
      prisma.user.count({ where: { isPremium: true } }),
    ]);

    return successResponse(res, {
      totalUsers, totalSchemes, totalSaved, activeSchemes, premiumUsers,
    }, 'Analytics fetched');
  } catch (err) { next(err); }
});

export default router;
