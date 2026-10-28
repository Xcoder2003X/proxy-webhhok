# T10 — Retention job
Reads: 02-data-model.md
Include: src/worker.ts src/db/pool.ts

## Goal
Delete expired events automatically.

## Create
src/modules/retention/job.ts: deletes `WHERE expires_at < now()` in batches of 1,000 until none left; runs every 10 minutes inside the worker process; logs counts (no payloads).

## Acceptance
- Expired events and their attempts are gone; non-expired untouched
- Never deletes `pending`/`delivering` events even if expired
- Batch loop terminates and does not lock the table for long
- Time is injected in tests

## Out of scope
Per-plan retention (post-MVP).
