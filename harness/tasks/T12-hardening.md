# T12 — Hardening, load test, Docker
Reads: 01-architecture.md 05-security.md 07-roadmap.md
Include: package.json src/app.ts src/server.ts src/worker.ts

## Goal
Make the MVP shippable.

## Create
Dockerfile (multi-stage, non-root) + docker-compose.prod.yml (api, worker, db), graceful shutdown for api and worker,
per-slug rate limit on ingest, scripts/loadtest.ts (autocannon, 1,000 req/s, reports p50/p95/p99),
DEPLOY.md (env vars, migrate step, one container + Postgres, backups note).

## Acceptance
- SIGTERM finishes in-flight requests/deliveries before exit
- Load test result is recorded in DEPLOY.md; target ingest p95 < 10 ms locally — if missed, list the top 3 causes found
- Image builds, runs as non-root, migrations run on deploy
- Run through the 4 MVP success criteria in docs/00 and write the result in harness/status.md

## Out of scope
Dashboard, billing.
