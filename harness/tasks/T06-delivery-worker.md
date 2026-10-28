# T06 — Delivery worker
Reads: 01-architecture.md 02-data-model.md 03-api-spec.md 05-security.md
Include: src/config.ts src/db/pool.ts src/lib/crypto.ts src/modules/events/repo.ts

## Goal
Worker that claims due events and forwards them to the customer.

## Create
src/lib/ssrf.ts (`assertSafeDestination(url)` per docs/05, DNS resolution, no redirects),
src/modules/delivery/forward.ts (undici, 10 s timeout, header rules from docs/03),
src/modules/delivery/worker.ts (claim batch with FOR UPDATE SKIP LOCKED and locked_until lease, concurrency cap, graceful stop),
src/worker.ts entry. Record every attempt in delivery_attempts. For now: 2xx -> delivered, anything else -> failed.

## Acceptance
- Delivered request reaches a local test server with byte-identical body and original headers + X-Shield-* headers
- Two workers running together never deliver the same event twice
- An event whose lease expired is claimable again
- Private/loopback destinations are refused unless ALLOW_PRIVATE_DESTINATIONS in non-production
- Attempt rows have status, duration, error

## Out of scope
Backoff and retry decisions (T07).
