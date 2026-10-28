import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CryptoError,
  decrypt,
  encrypt,
  generateApiKey,
  generateSlug,
  sha256Hex,
} from '../../src/lib/crypto.js';

const configuredMasterKey = Buffer.alloc(32, 0x2a).toString('base64');

beforeEach(() => {
  vi.stubEnv('DATABASE_URL', 'postgres://user:pass@localhost:5432/app');
  vi.stubEnv('TEST_DATABASE_URL', 'postgres://user:pass@localhost:5432/app_test');
  vi.stubEnv('MASTER_KEY', configuredMasterKey);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('encrypt and decrypt', () => {
  it('round-trips empty, small, and 5 MB payloads', () => {
    const payloads: Array<[string, Buffer]> = [
      ['empty', Buffer.alloc(0)],
      ['small', Buffer.from('webhook payload')],
      ['5 MB', Buffer.alloc(5 * 1024 * 1024, 0x5a)],
    ];

    for (const [name, payload] of payloads) {
      expect(decrypt(encrypt(payload)), name).toEqual(payload);
    }
  });

  it('uses a new random IV for each encryption', () => {
    const payload = Buffer.from('same input');

    expect(encrypt(payload)).not.toEqual(encrypt(payload));
  });

  it('rejects tampered IV, authentication tag, and ciphertext with a typed error', () => {
    const encrypted = encrypt(Buffer.from('protected payload'));

    for (const offset of [1, 13, encrypted.length - 1]) {
      const tampered = Buffer.from(encrypted);
      tampered[offset] = (tampered[offset] ?? 0) ^ 0xff;

      expect(() => decrypt(tampered)).toThrow(CryptoError);
    }
  });

  it('rejects a truncated blob with a typed error', () => {
    const encrypted = encrypt(Buffer.from('protected payload'));

    expect(() => decrypt(encrypted.subarray(0, 28))).toThrow(CryptoError);
  });

  it('rejects an unsupported format version with a typed error', () => {
    const encrypted = encrypt(Buffer.from('protected payload'));
    encrypted[0] = 0x02;

    expect(() => decrypt(encrypted)).toThrow(CryptoError);
  });

  it('rejects a different valid 32-byte key with a typed error', () => {
    const encrypted = encrypt(Buffer.from('protected payload'));
    vi.stubEnv('MASTER_KEY', Buffer.alloc(32, 0x01).toString('base64'));

    expect(() => decrypt(encrypted)).toThrow(CryptoError);
  });
});

describe('key and identifier helpers', () => {
  it('returns the SHA-256 digest as lowercase hexadecimal', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
  });

  it('generates API keys with the documented prefix and 32-byte base64url secret', () => {
    expect(generateApiKey()).toMatch(/^whs_[A-Za-z0-9_-]{43}$/);
  });

  it('generates URL-safe slugs with at least 16 characters', () => {
    expect(generateSlug()).toMatch(/^[A-Za-z0-9_-]{16,}$/);
  });
});
