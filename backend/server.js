import 'dotenv/config';
import { createServer } from 'http';
import app from './src/app.js';
import { logger } from './src/utils/logger.js';
import { emailWorker } from './src/workers/email.worker.js';
import { startDeadlineDetector } from './src/cron/deadlineDetector.js';
import { startFreshnessChecker } from './src/cron/freshnessChecker.js';

const PORT = process.env.PORT || 5000;

const server = createServer(app);

server.listen(PORT, () => {
  logger.info(`🚀 SarkariSahayak API running on port ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`   Health: http://localhost:${PORT}/api/health`);
});

// Start background workers
logger.info('Starting email worker...');
// (emailWorker is auto-started on import)

// Start cron jobs
startDeadlineDetector();
startFreshnessChecker();

// Graceful shutdown
const shutdown = async (signal) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(async () => {
    logger.info('HTTP server closed');
    await emailWorker.close();
    logger.info('BullMQ workers closed');
    process.exit(0);
  });

  // Force exit if graceful shutdown takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection:', reason);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception:', err);
  process.exit(1);
});
