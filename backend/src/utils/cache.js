import redis from '../config/redis.js';
import { logger } from './logger.js';

/**
 * Cache-aside pattern helper.
 * Tries to get value from Redis; if miss, calls fetchFn, caches result, returns it.
 *
 * @param {string} key - Redis cache key
 * @param {number} ttlSeconds - Time-to-live in seconds
 * @param {Function} fetchFn - Async function that fetches fresh data
 * @returns {Promise<any>} Cached or freshly fetched data
 */
export const withCache = async (key, ttlSeconds, fetchFn) => {
  try {
    const cached = await redis.get(key);
    if (cached) {
      logger.debug(`Cache HIT: ${key}`);
      return JSON.parse(cached);
    }
  } catch (err) {
    logger.warn(`Cache GET failed for key ${key}:`, err.message);
  }

  const data = await fetchFn();

  try {
    await redis.setex(key, ttlSeconds, JSON.stringify(data));
    logger.debug(`Cache SET: ${key} (TTL: ${ttlSeconds}s)`);
  } catch (err) {
    logger.warn(`Cache SET failed for key ${key}:`, err.message);
  }

  return data;
};

/**
 * Invalidate a single cache key.
 */
export const invalidateCache = async (key) => {
  try {
    await redis.del(key);
    logger.debug(`Cache DEL: ${key}`);
  } catch (err) {
    logger.warn(`Cache DEL failed for key ${key}:`, err.message);
  }
};

/**
 * Invalidate all keys matching a pattern.
 * Use sparingly — KEYS is O(N).
 */
export const invalidateCachePattern = async (pattern) => {
  try {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      logger.debug(`Cache DEL pattern ${pattern}: ${keys.length} keys removed`);
    }
  } catch (err) {
    logger.warn(`Cache DEL pattern failed for ${pattern}:`, err.message);
  }
};
