import { createHmac } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { getVerifier, type Provider, type VerifyInput } from '../../src/modules/ingest/verifiers/index.js';

const secret = 'provider-signing-secret';
const now = new Date('2026-10-27T12:00:00.000Z');
const timestamp = Math.floor(now.getTime() / 1000);
const rawBody = Buffer.from('{"id":"evt_stripe_123","type":"invoice.paid"}');

type VerifierCase = {
  provider: Provider;
  signatureHeader: string;
  eventHeader?: string;
  eventIdValue?: string;
  expectedEventId: string | null;
  genericHeader?: string;
  malformedSignature: string;
  shortSignature: string;
  createSignature(secret: string, body: Buffer, now: Date): string;
};

const verifierCases: VerifierCase[] = [
  {
    provider: 'stripe',
    signatureHeader: 'sTrIpE-sIgNaTuRe',
    expectedEventId: 'evt_stripe_123',
    malformedSignature: `t=${timestamp},v1=not-hex`,
    shortSignature: `t=${timestamp},v1=ab`,
    createSignature: (signingSecret, body, date) => stripeSignature(signingSecret, body, Math.floor(date.getTime() / 1000)),
  },
  {
    provider: 'github',
    signatureHeader: 'x-hUb-sIgNaTuRe-256',
    eventHeader: 'x-gItHuB-dElIvErY',
    eventIdValue: 'delivery-123',
    expectedEventId: 'delivery-123',
    malformedSignature: 'sha256=not-hex',
    shortSignature: 'sha256=ab',
    createSignature: (signingSecret, body) => `sha256=${hexSignature(signingSecret, body)}`,
  },
  {
    provider: 'shopify',
    signatureHeader: 'X-sHoPiFy-HmAc-ShA256',
    eventHeader: 'x-sHoPiFy-WeBhOoK-Id',
    eventIdValue: 'shopify-delivery-123',
    expectedEventId: 'shopify-delivery-123',
    malformedSignature: 'not-base64',
    shortSignature: 'AQ==',
    createSignature: (signingSecret, body) => base64Signature(signingSecret, body),
  },
  {
    provider: 'generic',
    signatureHeader: 'X-Custom-Signature',
    expectedEventId: null,
    genericHeader: 'x-custom-signature',
    malformedSignature: 'sha256=not-hex',
    shortSignature: 'sha256=ab',
    createSignature: (signingSecret, body) => hexSignature(signingSecret, body),
  },
];

describe.each(verifierCases)('$provider signature verifier', (verifierCase) => {
  it('accepts a valid signature and returns the provider event ID', () => {
    const input = makeInput(verifierCase, rawBody, verifierCase.createSignature(secret, rawBody, now));

    expect(getVerifier(verifierCase.provider)(input)).toEqual({
      ok: true,
      eventId: verifierCase.expectedEventId,
    });
  });

  it('rejects a signature made with the wrong secret without throwing', () => {
    const signature = verifierCase.createSignature(secret, rawBody, now);
    const input = makeInput(verifierCase, rawBody, signature, 'wrong-secret');

    expect(() => getVerifier(verifierCase.provider)(input)).not.toThrow();
    expect(getVerifier(verifierCase.provider)(input).ok).toBe(false);
  });

  it('rejects a body changed after signing', () => {
    const signature = verifierCase.createSignature(secret, rawBody, now);
    const tamperedBody = Buffer.from(rawBody);
    tamperedBody[0] = (tamperedBody[0] ?? 0) ^ 0xff;

    expect(getVerifier(verifierCase.provider)(makeInput(verifierCase, tamperedBody, signature))).toMatchObject({
      ok: false,
    });
  });

  it('rejects a missing signature header without throwing', () => {
    const input = makeInput(verifierCase, rawBody, verifierCase.createSignature(secret, rawBody, now));
    input.headers = {};

    expect(() => getVerifier(verifierCase.provider)(input)).not.toThrow();
    expect(getVerifier(verifierCase.provider)(input).ok).toBe(false);
  });

  it('rejects malformed signatures without throwing', () => {
    const input = makeInput(verifierCase, rawBody, verifierCase.malformedSignature);

    expect(() => getVerifier(verifierCase.provider)(input)).not.toThrow();
    expect(getVerifier(verifierCase.provider)(input).ok).toBe(false);
  });

  it('rejects signatures with a mismatched digest length', () => {
    const input = makeInput(verifierCase, rawBody, verifierCase.shortSignature);

    expect(() => getVerifier(verifierCase.provider)(input)).not.toThrow();
    expect(getVerifier(verifierCase.provider)(input).ok).toBe(false);
  });
});

describe('Stripe signature verifier timestamp handling', () => {
  it.each([-300, 300])('accepts a valid signature exactly %i seconds from now', (offset) => {
    const signedTimestamp = timestamp + offset;
    const input = makeInput(
      verifierCases[0] as VerifierCase,
      rawBody,
      stripeSignature(secret, rawBody, signedTimestamp),
    );

    expect(getVerifier('stripe')(input)).toMatchObject({ ok: true });
  });

  it.each([-301, 301])('rejects a valid signature %i seconds from now', (offset) => {
    const signedTimestamp = timestamp + offset;
    const input = makeInput(
      verifierCases[0] as VerifierCase,
      rawBody,
      stripeSignature(secret, rawBody, signedTimestamp),
    );

    expect(getVerifier('stripe')(input)).toMatchObject({
      ok: false,
      reason: 'timestamp_out_of_tolerance',
    });
  });

  it('accepts a matching signature when another v1 signature does not match', () => {
    const validSignature = stripeSignature(secret, rawBody, timestamp).slice('t='.length);
    const digest = validSignature.slice(validSignature.indexOf('v1=') + 'v1='.length);
    const input = makeInput(
      verifierCases[0] as VerifierCase,
      rawBody,
      `t=${timestamp},v1=${'0'.repeat(64)},v1=${digest}`,
    );

    expect(getVerifier('stripe')(input)).toEqual({ ok: true, eventId: 'evt_stripe_123' });
  });
});

describe('generic signature verifier', () => {
  it('accepts signatures with and without the optional sha256 prefix', () => {
    const genericVerifier = verifierCases[3] as VerifierCase;
    const digest = hexSignature(secret, rawBody);

    expect(
      getVerifier('generic')(makeInput(genericVerifier, rawBody, digest)),
    ).toEqual({ ok: true, eventId: null });
    expect(
      getVerifier('generic')(makeInput(genericVerifier, rawBody, `sha256=${digest}`)),
    ).toEqual({ ok: true, eventId: null });
  });

  it('signs the raw bytes without converting them to text', () => {
    const binaryBody = Buffer.from([0x00, 0xff, 0x80, 0x29]);
    const genericVerifier = verifierCases[3] as VerifierCase;
    const signature = hexSignature(secret, binaryBody);

    expect(
      getVerifier('generic')(makeInput(genericVerifier, binaryBody, signature)),
    ).toEqual({ ok: true, eventId: null });
  });
});

function makeInput(
  verifierCase: VerifierCase,
  body: Buffer,
  signature: string,
  signingSecret: string = secret,
): VerifyInput {
  const headers: VerifyInput['headers'] = {
    [verifierCase.signatureHeader]: signature,
  };
  if (verifierCase.eventHeader) {
    headers[verifierCase.eventHeader] = verifierCase.eventIdValue;
  }

  const input: VerifyInput = {
    rawBody: body,
    headers,
    secret: signingSecret,
    now,
  };
  if (verifierCase.genericHeader) {
    input.genericHeader = verifierCase.genericHeader;
  }

  return input;
}

function stripeSignature(signingSecret: string, body: Buffer, signedTimestamp: number): string {
  const digest = createHmac('sha256', signingSecret)
    .update(`${signedTimestamp}.`)
    .update(body)
    .digest('hex');
  return `t=${signedTimestamp},v1=${digest}`;
}

function hexSignature(signingSecret: string, body: Buffer): string {
  return createHmac('sha256', signingSecret).update(body).digest('hex');
}

function base64Signature(signingSecret: string, body: Buffer): string {
  return createHmac('sha256', signingSecret).update(body).digest('base64');
}
