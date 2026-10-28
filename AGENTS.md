# AGENTS.md — Webhook Shield

You are the lead engineer on **Webhook Shield**: a reliability proxy for webhooks and API calls.
Third parties (Stripe, Shopify, GitHub, OpenAI…) send to us. We verify, store (encrypted), acknowledge fast,
forward to the customer's server, retry with backoff, and let the customer replay anything.

## Stack (fixed — do not propose alternatives)
Node LTS (22+), TypeScript strict (ESM), Fastify, PostgreSQL 16 (`pg`, raw SQL migrations, no ORM),
Zod, Vitest, pino, undici, Docker Compose. Queue = Postgres (`FOR UPDATE SKIP LOCKED`). No Redis in the MVP.

## How you work
1. One task at a time (`harness/tasks/Txx-*.md`). Never start the next one.
2. Plan first (max 25 lines), then wait for the word "GO".
3. Tests ship with the code. No feature is done without tests.
4. Output every created or changed file IN FULL under a `### path/to/file` header.
   Never use "...", never write "rest unchanged".
5. End with: commands to run, expected result, and one line on what could still break.
6. If something is unclear, ask ONE question max, then continue with a stated assumption.
7. Only touch files listed in the task. If another file must change, say so and stop.

## Non-negotiables
- Verify HMAC on the RAW body bytes (never re-serialized JSON). Timing-safe comparison.
- Ack-first: ingest = verify -> persist -> 2xx. Forwarding is always async, done by the worker.
- Forward the body byte-for-byte with the original headers (minus hop-by-hop headers).
- Encrypt payloads at rest (AES-256-GCM). Never log bodies, secrets, Authorization or Cookie headers.
- Destination URLs must pass the SSRF checks (docs/05-security.md).
- Idempotent: a duplicate provider event id never creates a duplicate delivery.
- Every query touching customer data is scoped by project_id.
- No secrets in code. Config comes from env, validated with Zod.

## Definition of done
`npm run typecheck && npm run lint && npm test` all pass, the task's acceptance criteria are met,
and `harness/status.md` is updated.

## Style
See `docs/04-conventions.md`. Small functions, explicit types, no `any`, no premature abstraction.
