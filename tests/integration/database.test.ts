import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { runMigrations } from '../../src/db/migrate.js';
import { createTestPool, truncateAllTables } from './helpers.js';

describe('database and readiness integration', () => {
  const pool = createTestPool();

  beforeAll(async () => {
    await runMigrations(pool);
  });

  beforeEach(async () => {
    await truncateAllTables(pool);
  });

  afterAll(async () => {
    await pool.end();
  });

  it('does not apply an already recorded migration again', async () => {
    const appliedCount = await runMigrations(pool);

    expect(appliedCount).toBe(0);
  });

  it('rolls back a failed migration and leaves it unrecorded', async () => {
    const migrationsDirectory = await mkdtemp(join(tmpdir(), 'webhook-shield-migration-'));
    const migrationName = '001_failing_migration.sql';

    try {
      await writeFile(
        join(migrationsDirectory, migrationName),
        'CREATE TABLE migration_rollback_probe (id integer); SELECT 1 / 0;',
        'utf8',
      );

      await expect(runMigrations(pool, migrationsDirectory)).rejects.toThrow();

      const tableResult = await pool.query<{ table_name: string | null }>(
        "SELECT to_regclass('public.migration_rollback_probe') AS table_name",
      );
      const migrationResult = await pool.query<{ name: string }>(
        'SELECT name FROM schema_migrations WHERE name = $1',
        [migrationName],
      );

      expect(tableResult.rows[0]?.table_name).toBeNull();
      expect(migrationResult.rowCount).toBe(0);
    } finally {
      await rm(migrationsDirectory, { recursive: true, force: true });
    }
  });

  it('returns 200 when the database answers SELECT 1', async () => {
    const app = buildApp({ db: pool });

    try {
      const response = await app.inject({ method: 'GET', url: '/readyz' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });

  it('returns 503 when the database query fails', async () => {
    const unavailableDatabase = {
      query: async (): Promise<unknown> => {
        throw new Error('database unavailable');
      },
    };
    const app = buildApp({ db: unavailableDatabase });

    try {
      const response = await app.inject({ method: 'GET', url: '/readyz' });

      expect(response.statusCode).toBe(503);
      expect(response.json()).toEqual({ status: 'unavailable' });
    } finally {
      await app.close();
    }
  });
});
