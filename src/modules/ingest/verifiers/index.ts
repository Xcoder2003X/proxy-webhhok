import { verify as verifyGeneric } from './generic.js';
import { verify as verifyGitHub } from './github.js';
import { verify as verifyShopify } from './shopify.js';
import { verify as verifyStripe } from './stripe.js';

export type Provider = 'stripe' | 'github' | 'shopify' | 'generic';

export type VerifyInput = {
  rawBody: Buffer;
  headers: Record<string, string | string[] | undefined>;
  secret: string;
  now: Date;
  genericHeader?: string;
};

export type VerifyResult =
  | { ok: true; eventId: string | null }
  | { ok: false; reason: string };

export type Verifier = (input: VerifyInput) => VerifyResult;

const verifiers: Record<Provider, Verifier> = {
  stripe: verifyStripe,
  github: verifyGitHub,
  shopify: verifyShopify,
  generic: verifyGeneric,
};

export function getVerifier(provider: Provider): Verifier {
  return verifiers[provider];
}
