import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
  timingSafeEqual as nodeTimingSafeEqual,
} from 'node:crypto';
import { loadMasterKey } from '../config.js';

const version = 0x01;
const ivLength = 12;
const authTagLength = 16;
const headerLength = 1 + ivLength + authTagLength;

export type CryptoErrorCode =
  | 'INVALID_BLOB'
  | 'UNSUPPORTED_VERSION'
  | 'AUTHENTICATION_FAILED'
  | 'INVALID_KEY';

export class CryptoError extends Error {
  constructor(readonly code: CryptoErrorCode, message: string) {
    super(message);
    this.name = 'CryptoError';
  }
}

export function safeEqual(left: Buffer, right: Buffer): boolean {
  if (left.length !== right.length) {
    return false;
  }

  return nodeTimingSafeEqual(left, right);
}

function getEncryptionKey(): Buffer {
  try {
    return loadMasterKey(process.env);
  } catch {
    throw new CryptoError('INVALID_KEY', 'MASTER_KEY must be configured as Base64 for 32 bytes');
  }
}

export function encrypt(plain: Buffer): Buffer {
  const iv = randomBytes(ivLength);
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(plain), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return Buffer.concat([Buffer.from([version]), iv, authTag, ciphertext]);
}

export function decrypt(blob: Buffer): Buffer {
  if (blob.length < headerLength) {
    throw new CryptoError('INVALID_BLOB', 'Encrypted payload is truncated');
  }

  if (blob[0] !== version) {
    throw new CryptoError('UNSUPPORTED_VERSION', 'Encrypted payload version is unsupported');
  }

  const iv = blob.subarray(1, 1 + ivLength);
  const authTag = blob.subarray(1 + ivLength, headerLength);
  const ciphertext = blob.subarray(headerLength);
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv);
  decipher.setAuthTag(authTag);

  try {
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new CryptoError('AUTHENTICATION_FAILED', 'Encrypted payload authentication failed');
  }
}

export function sha256Hex(input: string | Buffer): string {
  return createHash('sha256').update(input).digest('hex');
}

export function generateApiKey(): string {
  return `whs_${randomBytes(32).toString('base64url')}`;
}

export function generateSlug(): string {
  return randomBytes(16).toString('base64url');
}
