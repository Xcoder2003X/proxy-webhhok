import 'dotenv/config';

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Pool, PoolClient } from 'pg';
import { loadConfig } from '../config.js';
import { createDbPool } from './pool.js';

const migrationLockKey = 1_947_631_205;
const defaultMigrationsDirectory = fileURLToPath(new URL('./migrations/', import.meta.url));

export async function runMigrations(
  pool: Pool,
  migrationsDirectory: string = defaultMigrationsDirectory,
): Promise<number> {
  const client = await pool.connect();
  let lockAcquired = false;

  try {
    await client.query('SELECT pg_advisory_lock($1)', [migrationLockKey]);
    lockAcquired = true;
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const migrationFiles = (await readdir(migrationsDirectory))
      .filter((fileName) => /^\d+_[a-z0-9_-]+\.sql$/.test(fileName))
      .sort();
    let appliedCount = 0;

    for (const fileName of migrationFiles) {
      const wasApplied = await applyMigration(client, migrationsDirectory, fileName);
      if (wasApplied) {
        appliedCount += 1;
      }
    }

    return appliedCount;
  } finally {
    try {
      if (lockAcquired) {
        await client.query('SELECT pg_advisory_unlock($1)', [migrationLockKey]);
      }
    } finally {
      client.release();
    }
  }
}

async function applyMigration(
  client: PoolClient,
  migrationsDirectory: string,
  fileName: string,
): Promise<boolean> {
  await client.query('BEGIN');

  try {
    const existing = await client.query<{ name: string }>(
      'SELECT name FROM schema_migrations WHERE name = $1',
      [fileName],
    );

    if (existing.rowCount !== 0) {
      await client.query('COMMIT');
      return false;
    }

    const sql = await readFile(resolve(migrationsDirectory, fileName), 'utf8');
    await client.query(sql);
    await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [fileName]);
    await client.query('COMMIT');
    return true;
  } catch (error: unknown) {
    await client.query('ROLLBACK').catch(() => undefined);
    throw error;
  }
}

async function migrateFromEnvironment(): Promise<void> {
  const config = loadConfig(process.env);
  const pool = createDbPool(config.databaseUrl);

  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  migrateFromEnvironment().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown migration error';
    console.error(`Database migration failed: ${message}`);
    process.exitCode = 1;
  });
}
