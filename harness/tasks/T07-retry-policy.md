# T07 — Retry policy & backoff
Reads: 01-architecture.md 06-decisions.md
Include: src/modules/delivery/worker.ts src/modules/delivery/forward.ts src/modules/events/repo.ts

## Goal
Implement ADR-004 in a pure, testable way and wire it into the worker.

## Create
src/lib/backoff.ts: `computeDelayMs(attempt, rng)` full jitter, base 10 s, cap 6 h.
src/modules/delivery/policy.ts: `decide({ status?, error?, retryAfterMs?, attempts }) => { action: 'retry', delayMs } | { action: 'fail' } | { action: 'dead' }`.
Wire into worker: update status, attempts, next_attempt_at, last_error.

## Acceptance
- Retry on network error, timeout, 408, 429 (honor Retry-After, capped at 6 h), 5xx
- 4xx other than 408/429 -> `failed`, no auto retry
- After 8 attempts -> `dead`
- Backoff is monotonic in its upper bound and never exceeds the cap (seeded rng in tests)
- Integration: server returns 500 twice then 200 -> delivered on attempt 3

## Out of scope
Alerts, replay.
