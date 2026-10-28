import type { Pool } from 'pg';
import { loadConfig } from '../../src/config.js';
import { createDbPool } from '../../src/db/pool.js';

export function createTestPool(): Pool {
  const config = loadConfig(process.env);
  return createDbPool(config.testDatabaseUrl);
}

export async function truncateAllTables(pool: Pool): Promise<void> {
  await pool.query(`
    TRUNCATE TABLE
      delivery_attempts,
      events,
      endpoints,
      alert_channels,
      alert_state,
      projects
    CASCADE
  `);
}
