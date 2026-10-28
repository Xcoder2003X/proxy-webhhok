import { createHmac } from 'node:crypto';
import { safeEqual } from '../../../lib/crypto.js';
import type { VerifyInput, VerifyResult } from './index.js';

const signaturePattern = /^[0-9a-fA-F]{64}$/;
const toleranceSeconds = 300;

export function verify(input: VerifyInput): VerifyResult {
  const signatureHeader = getHeaderValue(input.headers, 'stripe-signature');
  if (!signatureHeader) {
    return { ok: false, reason: 'missing_signature' };
  }

  const parsed = parseSignatureHeader(signatureHeader);
  if (!parsed) {
    return { ok: false, reason: 'malformed_signature' };
  }

  const nowSeconds = Math.floor(input.now.getTime() / 1000);
  if (!Number.isFinite(nowSeconds) || Math.abs(nowSeconds - parsed.timestamp) > toleranceSeconds) {
    return { ok: false, reason: 'timestamp_out_of_tolerance' };
  }

  if (input.secret.length === 0) {
    return { ok: false, reason: 'invalid_secret' };
  }

  const timestampBytes = Buffer.from(parsed.timestampText, 'utf8');
  const expected = createHmac('sha256', input.secret)
    .update(timestampBytes)
    .update('.')
    .update(input.rawBody)
    .digest();
  let hasMatchingSignature = false;
  for (const signature of parsed.signatures) {
    if (!signaturePattern.test(signature)) {
      continue;
    }

    const matches = safeEqual(expected, Buffer.from(signature, 'hex'));
    hasMatchingSignature = matches || hasMatchingSignature;
  }

  if (!hasMatchingSignature) {
    return { ok: false, reason: 'invalid_signature' };
  }

  return { ok: true, eventId: extractEventId(input.rawBody) };
}

function parseSignatureHeader(
  value: string,
): { timestamp: number; timestampText: string; signatures: string[] } | null {
  let timestampValue: string | undefined;
  const signatures: string[] = [];

  for (const component of value.split(',')) {
    const separator = component.indexOf('=');
    if (separator <= 0) {
      return null;
    }

    const name = component.slice(0, separator).trim();
    const fieldValue = component.slice(separator + 1).trim();
    if (name.length === 0 || fieldValue.length === 0) {
      return null;
    }

    if (name === 't') {
      if (timestampValue !== undefined) {
        return null;
      }
      timestampValue = fieldValue;
    } else if (name === 'v1') {
      signatures.push(fieldValue);
    }
  }

  if (!timestampValue || !/^\d+$/.test(timestampValue) || signatures.length === 0) {
    return null;
  }

  const timestamp = Number(timestampValue);
  if (!Number.isSafeInteger(timestamp)) {
    return null;
  }

  return { timestamp, timestampText: timestampValue, signatures };
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

function extractEventId(rawBody: Buffer): string | null {
  try {
    const parsed: unknown = JSON.parse(rawBody.toString('utf8'));
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      return null;
    }

    const id = (parsed as Record<string, unknown>).id;
    return typeof id === 'string' && id.trim().length > 0 ? id : null;
  } catch {
    return null;
  }
}
