# 02 — Data model (PostgreSQL 16)

All ids are UUID v7 or `gen_random_uuid()`. All timestamps `timestamptz`. Migrations are plain SQL in `src/db/migrations/NNN_name.sql`.

## projects
id, name, api_key_hash (sha256 hex, unique), retention_days int default 3, created_at

## endpoints
id, project_id → projects, slug (unique, url-safe, 16+ random chars), provider enum(`stripe`,`github`,`shopify`,`generic`),
signing_secret_enc bytea, generic_header text null (header carrying the HMAC for `generic`),
destination_url text, silence_minutes int null (alert if no traffic), active bool default true, created_at

## events
id, project_id, endpoint_id, provider_event_id text null, received_at,
method text, path text, headers jsonb (redacted), body_enc bytea, body_size int, content_type text,
signature_valid bool (always true for stored events in MVP),
status enum(`pending`,`delivering`,`delivered`,`failed`,`dead`),
attempts int default 0, next_attempt_at timestamptz, locked_until timestamptz null,
last_error text null, delivered_at null, replay_count int default 0, expires_at timestamptz
- UNIQUE (endpoint_id, provider_event_id) WHERE provider_event_id IS NOT NULL
- INDEX (status, next_attempt_at) WHERE status IN ('pending','delivering')
- INDEX (project_id, received_at DESC, id DESC)
- INDEX (expires_at)

## delivery_attempts
id, event_id → events ON DELETE CASCADE, attempt_no int, started_at, duration_ms int,
response_status int null, error text null, response_snippet text null (max 1 KB, never encrypted data of ours)

## alert_channels
id, project_id, type enum(`slack`,`discord`), config_enc bytea (webhook URL), enabled bool, created_at

## alert_state
key text primary key (e.g. `dead:<endpoint_id>`), last_sent_at — used for cooldown.

## Rules
- Every read/write on customer data is scoped by `project_id`.
- `body_enc` format is defined in docs/05-security.md.
