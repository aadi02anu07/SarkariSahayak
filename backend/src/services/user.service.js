import prisma from '../config/db.js';
import { uploadToCloudinary, deleteFromCloudinary, getSignedUrl } from '../config/cloudinary.js';
import { logger } from '../utils/logger.js';

/**
 * Calculate profile completeness score (0-100).
 */
const calculateProfileScore = (profile) => {
  const fields = [
    'state', 'category', 'age', 'gender', 'occupation',
    'annualIncome', 'education', 'isDisabled', 'hasBankAcct', 'isBpl', 'familySize',
  ];
  const filled = fields.filter((f) => profile[f] !== null && profile[f] !== undefined);
  return Math.round((filled.length / fields.length) * 100);
};

/**
 * Get own user details.
 */
export const getMe = async (userId) => {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true, name: true, email: true, role: true,
      isPremium: true, premiumExpiresAt: true, isVerified: true, createdAt: true,
      profile: { select: { profileScore: true } },
    },
  });
};

/**
 * Update user name.
 */
export const updateMe = async (userId, data) => {
  return prisma.user.update({
    where: { id: userId },
    data,
    select: { id: true, name: true, email: true },
  });
};

/**
 * Get eligibility profile.
 */
export const getProfile = async (userId) => {
  return prisma.userProfile.findUnique({ where: { userId } });
};

/**
 * Update eligibility profile and recalculate score.
 */
export const updateProfile = async (userId, data) => {
  const existing = await prisma.userProfile.findUnique({ where: { userId } });
  const merged = { ...existing, ...data };
  const profileScore = calculateProfileScore(merged);

  return prisma.userProfile.upsert({
    where: { userId },
    update: { ...data, profileScore },
    create: { userId, ...data, profileScore },
  });
};

/**
 * Get all saved schemes with status.
 */
export const getSavedSchemes = async (userId) => {
  return prisma.savedScheme.findMany({
    where: { userId },
    include: {
      scheme: {
        select: {
          id: true, name: true, slug: true, benefitType: true,
          benefitAmount: true, closeDate: true, isRolling: true,
          status: true, ministry: true, tags: true,
        },
      },
    },
    orderBy: { savedAt: 'desc' },
  });
};

/**
 * Save a scheme.
 */
export const saveScheme = async (userId, schemeId) => {
  return prisma.savedScheme.upsert({
    where: { userId_schemeId: { userId, schemeId } },
    update: {},
    create: { userId, schemeId },
  });
};

/**
 * Update application status for a saved scheme.
 */
export const updateSavedScheme = async (userId, schemeId, data) => {
  return prisma.savedScheme.update({
    where: { userId_schemeId: { userId, schemeId } },
    data,
  });
};

/**
 * Remove a saved scheme.
 */
export const removeSavedScheme = async (userId, schemeId) => {
  return prisma.savedScheme.delete({
    where: { userId_schemeId: { userId, schemeId } },
  });
};

/**
 * List user's uploaded documents (with signed URLs).
 */
export const getDocuments = async (userId) => {
  const docs = await prisma.document.findMany({
    where: { userId },
    orderBy: { uploadedAt: 'desc' },
  });

  // Generate fresh signed URLs
  return docs.map((doc) => ({
    ...doc,
    signedUrl: getSignedUrl(doc.cloudinaryId),
  }));
};

/**
 * Upload a document to Cloudinary and save record.
 */
export const uploadDocument = async (userId, file, docType) => {
  // Check free tier limit (2 documents)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isPremium: true } });
  if (!user.isPremium) {
    const count = await prisma.document.count({ where: { userId } });
    if (count >= 2) {
      const err = new Error('Free tier allows maximum 2 document uploads. Upgrade to Premium for unlimited uploads.');
      err.statusCode = 403;
      err.code = 'FREE_TIER_LIMIT';
      throw err;
    }
  }

  const result = await uploadToCloudinary(file.buffer, { userId, type: 'authenticated' });

  return prisma.document.create({
    data: {
      userId,
      type: docType,
      fileUrl: result.secure_url,
      cloudinaryId: result.public_id,
      originalName: file.originalname,
      fileSize: file.size,
    },
  });
};

/**
 * Delete a document.
 */
export const deleteDocument = async (userId, docId) => {
  const doc = await prisma.document.findFirst({ where: { id: docId, userId } });
  if (!doc) {
    const err = new Error('Document not found');
    err.statusCode = 404;
    throw err;
  }

  await deleteFromCloudinary(doc.cloudinaryId);
  await prisma.document.delete({ where: { id: docId } });
};

/**
 * Delete user account and all associated data.
 */
export const deleteAccount = async (userId) => {
  // Cascade delete handles all related records
  await prisma.user.delete({ where: { id: userId } });
  logger.info(`User account deleted: ${userId}`);
};
