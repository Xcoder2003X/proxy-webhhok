import 'dotenv/config';

import { buildApp } from './app.js';
import { loadConfig } from './config.js';
import { createDbPool } from './db/pool.js';

async function startServer(): Promise<void> {
  const config = loadConfig(process.env);
  const pool = createDbPool(config.databaseUrl);
  const app = buildApp({ db: pool });
  app.addHook('onClose', async () => {
    await pool.end();
  });
  app.log.level = config.logLevel;

  try {
    await app.listen({ host: '0.0.0.0', port: config.port });
  } catch (error: unknown) {
    await app.close();
    throw error;
  }
}

startServer().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown startup error';
  console.error(`Server startup failed: ${message}`);
  process.exitCode = 1;
});
