# 00 — Product brief

## Problem
A missed Stripe/Shopify/GitHub webhook = a lost payment, order or sync. Providers retry for a limited time,
then give up. Teams find out days later, from a customer complaint.

## Solution
Webhook Shield sits between the provider and the customer's server.
The customer only changes the webhook URL at the provider to `https://<shield>/in/<slug>`.
We capture, verify, store (encrypted), acknowledge instantly, forward, retry automatically, alert, and allow 1-click replay.

## ICP
SaaS startups, web agencies, solopreneurs, e-commerce merchants.

## Plans (reference, billing is post-MVP)
| Plan | Events/month | Retention | Extras |
|------|--------------|-----------|--------|
| Free | 10,000 | 3 days | — |
| Pro ($29) | 100,000 | 30 days | alerts, auto-replay |
| Team ($99–199) | 1–5 M | 90 days | multi-project, SSO, SLA |

## MVP scope (IN)
Ingest + HMAC verification (Stripe, GitHub, Shopify, generic HMAC), encrypted storage, async forwarding,
exponential backoff retries, dead-letter state, management API with API keys, single + batch replay,
retention cleanup, Slack/Discord alerts, Docker image, load test.

## Out of scope (post-MVP)
Dashboard UI, billing/quotas, SSO, PagerDuty/Email/SMS, multi-region, transformations/filters, OpenAI streaming proxying.

## MVP success criteria
1. Kill the customer server for 10 minutes -> zero events lost; all delivered after it returns.
2. Ingest overhead p95 < 10 ms locally (DB insert included) at 1,000 req/s.
3. Replay of 1,000 events works with one API call.
4. A forged signature is never stored nor forwarded.
