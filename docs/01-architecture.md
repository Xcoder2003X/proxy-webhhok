# 01 — Architecture

```
Provider ──POST /in/:slug──► [ API process (Fastify) ]
                               1. raw body buffer
                               2. lookup endpoint by slug
                               3. verify signature (HMAC) ── invalid ──► 401, nothing stored
                               4. dedupe (endpoint_id, provider_event_id)
                               5. encrypt body, redact headers, INSERT event(status=pending)
                               6. 200 OK  (target overhead p95 < 10 ms)
                                      │
                                   Postgres  ◄──────────────┐
                                      │                     │
                        [ Worker loop (same repo, own process) ]
                          claim due events (FOR UPDATE SKIP LOCKED, lease)
                          SSRF check -> forward to customer (undici, 10 s timeout)
                          record delivery_attempt
                          2xx ─► delivered | retryable ─► pending + next_attempt_at | exhausted ─► dead
                                      │
                          alerts (Slack/Discord) on dead / failure spike / silence
                          retention job (delete expired events)

Customer ──Bearer API key──► /v1/* management API (endpoints, events, replay, alert channels)
```

## Processes
- `api` — Fastify server: ingest + management. Stateless.
- `worker` — delivery loop, alerts, retention job. Can run N copies safely (SKIP LOCKED + lease).
Both are started from the same codebase (`npm run start:api`, `npm run start:worker`).

## Latency budget (ingest)
Parse raw body < 1 ms · endpoint lookup (indexed slug, small in-memory cache with short TTL) < 1 ms ·
HMAC < 0.5 ms · AES-GCM < 0.5 ms · INSERT < 5 ms. Nothing else happens in the request path.

## Failure modes to handle
| Failure | Behavior |
|---------|----------|
| Customer server down / 5xx / timeout | retry with backoff, then dead |
| Customer returns 4xx (not 408/429) | mark failed, no auto-retry, manual replay allowed |
| Worker crashes mid-delivery | lease expires, event becomes claimable again |
| DB briefly unavailable at ingest | return 503 so the provider retries |
| Duplicate delivery from provider | deduped by provider event id |
| Poison payload / huge body | rejected above body limit with 413 |
