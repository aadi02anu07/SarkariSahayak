import prisma from '../config/db.js';
import { matchSchemes } from '../utils/eligibilityEngine.js';
import { buildPaginationArgs, processPaginatedResults } from '../utils/pagination.js';
import { withCache, invalidateCache, invalidateCachePattern } from '../utils/cache.js';
import emailQueue from '../queues/emailQueue.js';
import { logger } from '../utils/logger.js';

/**
 * Get a paginated, filtered list of schemes.
 */
export const listSchemes = async (filters) => {
  const { state, category, benefitType, status = 'ACTIVE', tags, search, cursor, limit = 20, sort = 'newest' } = filters;

  const where = { status };

  if (state) {
    where.OR = [
      { isCentral: true },
      { state },
    ];
  }

  if (benefitType) where.benefitType = benefitType;

  if (tags) {
    const tagArray = Array.isArray(tags) ? tags : [tags];
    where.tags = { hasSome: tagArray };
  }

  if (search) {
    where.OR = [
      ...(where.OR || []),
      { name: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }

  const orderBy = {
    newest: { createdAt: 'desc' },
    deadline_asc: { closeDate: 'asc' },
    views_desc: { viewCount: 'desc' },
  }[sort] || { createdAt: 'desc' };

  const paginationArgs = buildPaginationArgs(cursor, limit);

  const items = await prisma.scheme.findMany({
    where,
    orderBy,
    ...paginationArgs,
    select: {
      id: true,
      name: true,
      nameHindi: true,
      slug: true,
      ministry: true,
      isCentral: true,
      state: true,
      benefitType: true,
      benefitAmount: true,
      tags: true,
      status: true,
      closeDate: true,
      isRolling: true,
      viewCount: true,
      lastVerified: true,
      documentsNeeded: true,
    },
  });

  return processPaginatedResults(items, limit);
};

/**
 * Get a single scheme by slug. Increments view count.
 */
export const getSchemeBySlug = async (slug) => {
  const scheme = await prisma.scheme.findUnique({
    where: { slug },
    include: {
      _count: { select: { reviews: true, questions: true } },
    },
  });

  if (!scheme) {
    const err = new Error('Scheme not found');
    err.statusCode = 404;
    err.code = 'NOT_FOUND';
    throw err;
  }

  // Async view count increment (fire and forget)
  prisma.scheme.update({
    where: { slug },
    data: { viewCount: { increment: 1 } },
  }).catch(() => {});

  return scheme;
};

/**
 * Full-text search using PostgreSQL.
 */
export const searchSchemes = async (query, limit = 20) => {
  if (!query || query.trim().length < 2) return [];

  // Use Prisma raw for full-text search
  const results = await prisma.$queryRaw`
    SELECT id, name, name_hindi, slug, ministry, benefit_type, benefit_amount,
           tags, status, close_date, is_rolling
    FROM schemes
    WHERE status = 'ACTIVE'
      AND (
        name ILIKE ${`%${query}%`}
        OR description ILIKE ${`%${query}%`}
        OR ministry ILIKE ${`%${query}%`}
      )
    ORDER BY view_count DESC
    LIMIT ${limit}
  `;

  return results;
};

/**
 * Match schemes against a user profile (eligibility engine).
 */
export const matchSchemesToProfile = async (profile, limit = 50) => {
  // Fetch all active schemes (eligibility check needs full criteria)
  const schemes = await prisma.scheme.findMany({
    where: { status: 'ACTIVE' },
    select: {
      id: true,
      name: true,
      slug: true,
      ministry: true,
      benefitType: true,
      benefitAmount: true,
      tags: true,
      closeDate: true,
      isRolling: true,
      documentsNeeded: true,
      applyUrl: true,
      eligibilityJson: true,
    },
  });

  const results = matchSchemes(schemes, profile);
  return results.slice(0, limit);
};

/**
 * Get trending schemes — top 10 by view count this week per state.
 */
export const getTrendingSchemes = async (state) => {
  const cacheKey = `trending:${state || 'all'}`;

  return withCache(cacheKey, 3600, async () => {
    const where = {
      status: 'ACTIVE',
      updatedAt: {
        gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
    };

    if (state) {
      where.OR = [{ isCentral: true }, { state }];
    }

    return prisma.scheme.findMany({
      where,
      orderBy: { viewCount: 'desc' },
      take: 10,
      select: {
        id: true, name: true, slug: true, benefitType: true,
        benefitAmount: true, viewCount: true, tags: true, state: true,
      },
    });
  });
};

// Life event → tag mapping
const LIFE_EVENT_TAGS = {
  'starting-a-business': ['business', 'entrepreneur', 'mudra', 'loan'],
  'going-to-college': ['student', 'scholarship', 'education'],
  'lost-job': ['employment', 'labourer', 'skill-development'],
  'had-a-baby': ['maternity', 'child', 'woman'],
  'disability-diagnosis': ['disabled', 'disability', 'pension'],
  'buying-agricultural-equipment': ['farmer', 'agriculture', 'subsidy', 'equipment'],
};

/**
 * Get schemes by life event slug.
 */
export const getSchemesByLifeEvent = async (eventSlug) => {
  const tags = LIFE_EVENT_TAGS[eventSlug];
  if (!tags) {
    const err = new Error('Life event not found');
    err.statusCode = 404;
    throw err;
  }

  return prisma.scheme.findMany({
    where: {
      status: 'ACTIVE',
      tags: { hasSome: tags },
    },
    take: 20,
    orderBy: { viewCount: 'desc' },
  });
};

/**
 * Admin: Create a scheme.
 */
export const createScheme = async (data, creatorId) => {
  const scheme = await prisma.scheme.create({
    data: {
      ...data,
      createdBy: creatorId,
      openDate: data.openDate ? new Date(data.openDate) : null,
      closeDate: data.closeDate ? new Date(data.closeDate) : null,
      lastVerified: data.lastVerified ? new Date(data.lastVerified) : new Date(),
    },
  });

  logger.info(`Scheme created: ${scheme.name} (${scheme.id}) by ${creatorId}`);
  return scheme;
};

/**
 * Admin: Update a scheme.
 */
export const updateScheme = async (id, data) => {
  const scheme = await prisma.scheme.update({
    where: { id },
    data: {
      ...data,
      openDate: data.openDate ? new Date(data.openDate) : undefined,
      closeDate: data.closeDate ? new Date(data.closeDate) : undefined,
    },
  });

  await invalidateCache(`scheme:${id}`);
  await invalidateCachePattern('schemes:list:*');
  return scheme;
};

/**
 * Admin: Delete a scheme.
 */
export const deleteScheme = async (id) => {
  await prisma.scheme.delete({ where: { id } });
  await invalidateCache(`scheme:${id}`);
  await invalidateCachePattern('schemes:list:*');
};

/**
 * Admin: Publish a scheme (DRAFT → ACTIVE).
 * Triggers new scheme alert emails for matching users.
 */
export const publishScheme = async (id) => {
  const scheme = await prisma.scheme.update({
    where: { id },
    data: { status: 'ACTIVE', lastVerified: new Date() },
  });

  // Find users whose profile matches and send alerts
  // (fire and forget — don't block the response)
  notifyMatchingUsers(scheme).catch((err) => {
    logger.error('Error sending new scheme alerts:', err.message);
  });

  return scheme;
};

/**
 * Alert users when a new scheme is published that matches their profile.
 */
const notifyMatchingUsers = async (scheme) => {
  const usersWithProfiles = await prisma.userProfile.findMany({
    where: { user: { notificationPrefs: { newSchemeAlerts: true } } },
    include: { user: { select: { id: true } } },
  });

  for (const profile of usersWithProfiles) {
    const result = matchSchemes([scheme], profile);
    if (result.length > 0 && result[0].confidence !== 'NOT_ELIGIBLE') {
      await emailQueue.add('send-new-scheme-alert', {
        userId: profile.user.id,
        schemeIds: [scheme.id],
      });
    }
  }
};
