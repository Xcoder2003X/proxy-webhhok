# T05 — Ingest endpoint
Reads: 01-architecture.md 02-data-model.md 03-api-spec.md 05-security.md
Include: src/app.ts src/config.ts src/db/pool.ts src/lib/crypto.ts src/lib/redact.ts src/modules/ingest/verifiers/index.ts

## Goal
`POST /in/:slug` per docs/03: verify, dedupe, persist encrypted, ack.

## Create
src/modules/ingest/route.ts, src/modules/endpoints/repo.ts (findBySlug only), src/modules/events/repo.ts (insertEvent, findByProviderEventId).
Fastify content-type parser that keeps the raw Buffer for every content type. Body limit from MAX_BODY_BYTES.
expires_at = now + project.retention_days. DB failure -> 503.

## Acceptance (integration tests with app.inject + real Postgres)
- Valid Stripe/GitHub/Shopify/generic request -> 200, row stored, body_enc decrypts to the exact original bytes
- Invalid signature -> 401 and NO row
- Same provider event id twice -> second returns `duplicate:true`, one row only
- Unknown/inactive slug -> 404; body over limit -> 413
- Stored headers contain no authorization/cookie

## Out of scope
Forwarding, retries.
