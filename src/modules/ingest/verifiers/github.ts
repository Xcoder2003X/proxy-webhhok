import { createHmac } from 'node:crypto';
import { safeEqual } from '../../../lib/crypto.js';
import type { VerifyInput, VerifyResult } from './index.js';

const signaturePattern = /^[0-9a-fA-F]{64}$/;

export function verify(input: VerifyInput): VerifyResult {
  const signatureHeader = getHeaderValue(input.headers, 'x-hub-signature-256');
  if (!signatureHeader) {
    return { ok: false, reason: 'missing_signature' };
  }

  if (input.secret.length === 0 || !signatureHeader.startsWith('sha256=')) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const signatureHex = signatureHeader.slice('sha256='.length);
  if (!signaturePattern.test(signatureHex)) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const expected = createHmac('sha256', input.secret).update(input.rawBody).digest();
  const supplied = Buffer.from(signatureHex, 'hex');
  if (!safeEqual(expected, supplied)) {
    return { ok: false, reason: 'invalid_signature' };
  }

  return {
    ok: true,
    eventId: getHeaderValue(input.headers, 'x-github-delivery') ?? null,
  };
}

function getHeaderValue(
  headers: VerifyInput['headers'],
  name: string,
): string | undefined {
  const matches = Object.entries(headers).filter(([headerName]) => headerName.toLowerCase() === name);
  if (matches.length !== 1) {
    return undefined;
  }

  const value = matches[0]?.[1];
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}
