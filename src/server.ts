import { createApp } from './app';
import { env } from './config/env';
import { disconnectPrisma } from './config/database';
import { logger } from './utils/logger';

const app = createApp();

const server = app.listen(env.PORT, () => {
  logger.info('Server running', {
    port: env.PORT,
    env: env.NODE_ENV,
    endpoint: `http://localhost:${env.PORT}/identify`,
  });
});

async function shutdown(signal: string) {
  logger.info(`${signal} — shutting down`);

  server.close(async (err) => {
    if (err) {
      logger.error('Error closing server', { error: err.message });
      process.exit(1);
    }
    try {
      await disconnectPrisma();
      process.exit(0);
    } catch (e) {
      logger.error('Error disconnecting DB', { error: e });
      process.exit(1);
    }
  });

  setTimeout(() => {
    logger.error('Shutdown timeout, forcing exit');
    process.exit(1);
  }, 10_000);
}

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message });
  process.exit(1);
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
