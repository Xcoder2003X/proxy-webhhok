# T09 — Replay
Reads: 02-data-model.md 03-api-spec.md
Include: src/modules/events/routes.ts src/modules/events/repo.ts src/modules/delivery/worker.ts

## Goal
Single and batch replay.

## Create
src/modules/events/replay.ts, routes `POST /v1/events/:id/replay` and `POST /v1/events/replay-batch`.
Replay = status pending, next_attempt_at now, attempts reset to 0, replay_count + 1, forwarded with `X-Shield-Replay: true`.

## Acceptance
- Replaying a delivered, failed or dead event re-delivers it
- Replaying an event already pending/delivering is a no-op (no double delivery)
- Batch filters (endpoint_id, status, from, to) and caps at 1,000; response gives the count
- Project scoping enforced
- Integration: customer server down -> 20 events dead -> server up -> one batch call -> all delivered

## Out of scope
UI.
