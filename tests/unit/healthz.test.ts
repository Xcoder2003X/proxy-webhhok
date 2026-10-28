import { describe, expect, it } from 'vitest';
import { buildApp } from '../../src/app.js';
import { loadConfig } from '../../src/config.js';

describe('GET /healthz', () => {
  it('returns a successful health response', async () => {
    const app = buildApp();

    try {
      const response = await app.inject({ method: 'GET', url: '/healthz' });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toEqual({ status: 'ok' });
    } finally {
      await app.close();
    }
  });
});

describe('loadConfig', () => {
  it('decodes a valid Base64 master key into 32 bytes', () => {
    const expectedKey = Buffer.alloc(32, 0x2a);
    const config = loadConfig({
      DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
      TEST_DATABASE_URL: 'postgres://user:pass@localhost:5432/app_test',
      MASTER_KEY: expectedKey.toString('base64'),
    });

    expect(config.masterKey).toEqual(expectedKey);
  });

  it('rejects a master key that is not Base64 encoding of 32 bytes', () => {
    expect(() =>
      loadConfig({
        DATABASE_URL: 'postgres://user:pass@localhost:5432/app',
        TEST_DATABASE_URL: 'postgres://user:pass@localhost:5432/app_test',
        MASTER_KEY: 'not-base64',
      }),
    ).toThrow(/MASTER_KEY: must be valid Base64 encoding of exactly 32 bytes/);
  });
});
