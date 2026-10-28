# T11 — Alerts
Reads: 01-architecture.md 02-data-model.md 03-api-spec.md 05-security.md
Include: src/worker.ts src/db/pool.ts src/lib/crypto.ts src/modules/delivery/worker.ts

## Goal
Slack and Discord alerts for the situations that matter.

## Create
alert_channels routes (create/list/delete; URL stored encrypted), src/modules/alerts/{notifier,slack,discord,silence}.ts.
Triggers: (1) event becomes `dead`, (2) failure rate over 50% across the last 5 minutes with at least 10 attempts on an endpoint,
(3) silence: endpoint with `silence_minutes` set and traffic in the previous 24 h receives nothing for that duration.
Cooldown 30 min per alert key using alert_state.

## Acceptance
- Each trigger produces exactly one message per cooldown window (mocked HTTP in tests)
- Alert text contains endpoint name, counts and the event id, never the payload
- A failing Slack/Discord call never breaks delivery
- Channel URL never returned by the API after creation

## Out of scope
PagerDuty, Email, SMS.
