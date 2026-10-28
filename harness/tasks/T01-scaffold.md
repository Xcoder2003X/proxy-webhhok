# T01 — Scaffold & tooling
Reads: 04-conventions.md
Include:

## Goal
Runnable TypeScript/Fastify project skeleton with tooling and a health route.

## Create
package.json (scripts from docs/04), tsconfig (strict, ESM), ESLint flat config, vitest.config.ts,
docker-compose.yml (postgres:16, healthcheck), .env.example (DATABASE_URL, TEST_DATABASE_URL, MASTER_KEY, PORT, MAX_BODY_BYTES, ALLOW_PRIVATE_DESTINATIONS, LOG_LEVEL),
src/config.ts (Zod), src/app.ts (`buildApp()`), src/server.ts, GET /healthz, tests/unit/healthz.test.ts.

## Acceptance
- `npm run typecheck && npm run lint && npm test` pass
- `docker compose up -d db` starts Postgres; `npm run dev` serves /healthz
- Config fails fast with a clear message when env is invalid

## Out of scope
Database access, any business logic.
