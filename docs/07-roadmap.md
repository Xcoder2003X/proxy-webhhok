# 07 — Roadmap

| Milestone | Tasks | Outcome |
|-----------|-------|---------|
| M0 Foundations | T01–T04 | scaffold, DB, crypto, signature verifiers |
| M1 Core loop | T05–T07 | webhook in → stored → delivered with retries ("never lose a webhook") |
| M2 Operable | T08–T10 | API keys, endpoint/event management, replay, retention |
| M3 Shippable | T11–T12 | alerts, load test, Docker image, deploy notes |

## Post-MVP (in priority order)
1. Minimal dashboard (events list, detail, replay button)
2. Plans & quotas (events/month counters, retention per plan), Stripe billing
3. More providers (Paddle, Twilio, Slack signing, OpenAI), custom header auth
4. PagerDuty, Email, SMS channels
5. Auto-replay rules, filters/transformations
6. Teams, multi-project, SSO, SLA
