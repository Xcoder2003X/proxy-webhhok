# T02 — Database & migrations
Reads: 02-data-model.md 04-conventions.md
Include: src/config.ts src/app.ts

## Goal
Postgres access layer and a migration runner implementing docs/02-data-model.md.

## Create
src/db/pool.ts, src/db/migrate.ts (schema_migrations table, each migration in a transaction, idempotent),
src/db/migrations/001_init.sql (all tables, enums, indexes), `npm run migrate`,
GET /readyz (SELECT 1), tests/integration helpers (truncate all tables between tests).

## Acceptance
- Running migrate twice is a no-op the second time
- /readyz returns 200 with DB up, 503 with DB down
- Integration tests run against TEST_DATABASE_URL

## Out of scope
Repositories for specific modules.
