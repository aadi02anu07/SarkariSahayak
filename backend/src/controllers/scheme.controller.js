import * as schemeService from '../services/scheme.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/apiResponse.js';

export const listSchemes = async (req, res, next) => {
  try {
    const { data, nextCursor } = await schemeService.listSchemes(req.query);
    return paginatedResponse(res, data, 'Schemes fetched', { nextCursor, limit: req.query.limit });
  } catch (err) { next(err); }
};

export const getSchemeBySlug = async (req, res, next) => {
  try {
    const scheme = await schemeService.getSchemeBySlug(req.params.slug);
    return successResponse(res, scheme, 'Scheme fetched');
  } catch (err) { next(err); }
};

export const searchSchemes = async (req, res, next) => {
  try {
    const { q, limit } = req.query;
    if (!q) return errorResponse(res, 'Search query is required', 400);
    const results = await schemeService.searchSchemes(q, parseInt(limit) || 20);
    return successResponse(res, results, `Found ${results.length} results`);
  } catch (err) { next(err); }
};

export const matchSchemes = async (req, res, next) => {
  try {
    // Use logged-in user's profile or body payload for anonymous matching
    let profile;
    if (req.user) {
      const { default: prisma } = await import('../config/db.js');
      profile = await prisma.userProfile.findUnique({ where: { userId: req.user.id } });
      // Merge body overrides
      if (req.body && Object.keys(req.body).length > 0) {
        profile = { ...profile, ...req.body };
      }
    } else {
      profile = req.body;
    }

    if (!profile) return errorResponse(res, 'Profile data required', 400);

    const results = await schemeService.matchSchemesToProfile(profile);
    return successResponse(res, results, `Found ${results.length} matching schemes`);
  } catch (err) { next(err); }
};

export const getTrending = async (req, res, next) => {
  try {
    const { state } = req.query;
    const schemes = await schemeService.getTrendingSchemes(state);
    return successResponse(res, schemes, 'Trending schemes');
  } catch (err) { next(err); }
};

export const getByLifeEvent = async (req, res, next) => {
  try {
    const schemes = await schemeService.getSchemesByLifeEvent(req.params.eventSlug);
    return successResponse(res, schemes, 'Schemes for life event');
  } catch (err) { next(err); }
};
