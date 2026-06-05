import { createClient } from '@upstash/redis';
import Redis from 'ioredis';
import { logger } from '../utils/logger.js';

let redis;

// Use Upstash REST client in production (serverless-friendly)
// Use ioredis with local Redis in development
if (process.env.UPSTASH_REDIS_URL && process.env.UPSTASH_REDIS_TOKEN) {
  // Production: Upstash via ioredis (BullMQ compatible)
  redis = new Redis(process.env.UPSTASH_REDIS_URL, {
    password: process.env.UPSTASH_REDIS_TOKEN,
    tls: {},
    enableAutoPipelining: true,
    maxRetriesPerRequest: null, // Required by BullMQ
  });
  logger.info('✅ Redis connected via Upstash');
} else {
  // Development: local Redis
  redis = new Redis({
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    maxRetriesPerRequest: null, // Required by BullMQ
  });
  logger.info('✅ Redis connected (local)');
}

redis.on('error', (err) => {
  logger.error('Redis error:', err.message);
});

export default redis;
