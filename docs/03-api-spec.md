# 03 — API spec

Errors are always `{ "error": { "code": "string", "message": "string" } }`.

## Public ingest
`POST /in/:slug` — any content type, raw body kept as Buffer, default max 5 MB (`MAX_BODY_BYTES`).
- 200 `{ "ok": true, "id": "<event id>" }` stored
- 200 `{ "ok": true, "duplicate": true }` already received
- 401 invalid or missing signature · 404 unknown/inactive slug · 413 too large · 503 storage unavailable

### Signature schemes
| Provider | Header | Signed content | Notes |
|----------|--------|----------------|-------|
| stripe | `Stripe-Signature: t=...,v1=...` | HMAC-SHA256 hex of `${t}.${rawBody}` | tolerance 300 s; event id = JSON `id` |
| github | `X-Hub-Signature-256: sha256=...` | HMAC-SHA256 hex of rawBody | event id = `X-GitHub-Delivery` |
| shopify | `X-Shopify-Hmac-Sha256` | HMAC-SHA256 base64 of rawBody | event id = `X-Shopify-Webhook-Id` |
| generic | configurable header | HMAC-SHA256 hex of rawBody (optional `sha256=` prefix) | event id = null (no dedupe) |

## Management API (`Authorization: Bearer whs_...`)
- `GET /healthz` (no auth) · `GET /readyz` (checks DB)
- `POST /v1/endpoints` `{name?, provider, signing_secret, destination_url, generic_header?, silence_minutes?}` → `{id, slug, ingest_url, ...}`
- `GET /v1/endpoints` · `GET /v1/endpoints/:id` · `PATCH /v1/endpoints/:id` · `DELETE /v1/endpoints/:id` (soft: active=false)
- `GET /v1/events?endpoint_id=&status=&from=&to=&limit=50&cursor=` → keyset pagination, no bodies
- `GET /v1/events/:id?include=body` → event + attempts (+ decrypted body when asked)
- `POST /v1/events/:id/replay` → `{ok:true}`
- `POST /v1/events/replay-batch` `{endpoint_id?, status?, from?, to?, limit<=1000}` → `{replayed: n}`
- `POST /v1/alert-channels` `{type, url}` · `GET /v1/alert-channels` · `DELETE /v1/alert-channels/:id`

## Forwarded request (to the customer)
Same method, same body bytes, original headers (minus `host`, `content-length`, `connection`, `transfer-encoding`, hop-by-hop)
plus: `X-Shield-Event-Id`, `X-Shield-Attempt`, `X-Shield-Replay: true|false`.
