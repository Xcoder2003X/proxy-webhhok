# T04 — Signature verifiers
Reads: 03-api-spec.md 05-security.md
Include: src/lib/crypto.ts

## Goal
Pure, well-tested signature verification for each provider.

## Create
src/modules/ingest/verifiers/{stripe,github,shopify,generic,index}.ts
Interface: `verify({ rawBody: Buffer, headers: Record<string,string|string[]|undefined>, secret: string, now: Date, genericHeader?: string }) => { ok: true, eventId: string | null } | { ok: false, reason: string }`
`getVerifier(provider)` in index.ts.

## Acceptance (tests build their own signatures with node:crypto)
- Valid signature passes for each provider and returns the event id described in docs/03
- Wrong secret, tampered body, missing header, malformed header, mismatched length: all `ok:false`, never throw
- Stripe: timestamp older/newer than 300 s rejected; multiple v1 signatures accepted if any matches
- Header lookup is case-insensitive
- Comparison uses timingSafeEqual after length check

## Out of scope
HTTP routes, DB.
