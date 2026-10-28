# 04 — Conventions

## Layout
```
src/
  app.ts            buildApp(deps) — no side effects, testable with app.inject()
  server.ts         starts API
  worker.ts         starts delivery loop + retention + alerts
  config.ts         Zod-validated env
  db/               pool.ts, migrate.ts, migrations/*.sql
  lib/              crypto.ts, redact.ts, backoff.ts, ssrf.ts, ids.ts
  plugins/          auth.ts (API key)
  modules/
    ingest/         route.ts, verifiers/{stripe,github,shopify,generic,index}.ts
    delivery/       worker.ts, forward.ts, policy.ts
    endpoints/      routes.ts, repo.ts
    events/         routes.ts, repo.ts, replay.ts
    alerts/         notifier.ts, slack.ts, discord.ts, silence.ts
    retention/      job.ts
tests/
  unit/             pure logic, no DB
  integration/      real Postgres (TEST_DATABASE_URL), truncate between tests
scripts/            project-create.ts, loadtest.ts
```

## Code rules
- TypeScript `strict`, ESM, no `any`, no default exports, `node:` prefix for built-ins.
- Validate every external input with Zod at the boundary; internal code trusts types.
- Pure functions for logic (backoff, policy, verifiers) — easy to unit test.
- Repositories own SQL; routes never write SQL. Parameterized queries only.
- Errors: throw typed `AppError(code, httpStatus, message)` in routes; return result unions (`{ok:true}|{ok:false}`) in libs.
- Logging with pino, structured, with `event_id`, `endpoint_id`, `project_id`. Never log bodies or secrets.
- Time is injected (`now: () => Date`) wherever behavior depends on it.

## Tests
Vitest. Each module has unit tests for happy path + 2–3 failure cases. Integration tests for ingest, delivery, replay.
Test names describe behavior: `it('rejects a Stripe signature older than 5 minutes')`.

## Git
Conventional Commits (`feat:`, `fix:`, `test:`, `chore:`, `docs:`). One task = one commit (or a small series).

## npm scripts (T01)
`dev`, `build`, `start:api`, `start:worker`, `migrate`, `typecheck`, `lint`, `test`, `test:integration`, `project:create`, `loadtest`.
