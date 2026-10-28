# T08 — Management API & auth
Reads: 02-data-model.md 03-api-spec.md 05-security.md
Include: src/app.ts src/db/pool.ts src/lib/crypto.ts src/modules/endpoints/repo.ts src/modules/events/repo.ts

## Goal
API-key protected management routes.

## Create
src/plugins/auth.ts (Bearer key -> sha256 -> project, attaches projectId), scripts/project-create.ts (`npm run project:create -- "Name" 30` prints the API key once),
src/modules/endpoints/routes.ts (CRUD, soft delete), src/modules/events/routes.ts (list with keyset pagination, detail, `include=body`).
Signing secret never returned after creation. Destination URL validated with the SSRF check on create/update.

## Acceptance
- No/invalid key -> 401
- Project A can never see or modify project B's endpoints/events (tests prove it)
- Pagination returns stable, non-overlapping pages
- Body is decrypted only with include=body

## Out of scope
Replay (T09), alert channels (T11).
