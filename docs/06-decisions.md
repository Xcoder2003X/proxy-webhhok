# 06 — Decisions (ADR log)

- **ADR-001 Node + Fastify.** Fast enough for the target, large ecosystem, easy for an LLM to generate and the owner to maintain. Revisit Go/Rust only if profiling proves the need.
- **ADR-002 Postgres as the queue.** `SKIP LOCKED` + lease column. One datastore to run, transactional with event insert. Move to a broker only when sustained throughput demands it.
- **ADR-003 Ack-first.** The provider gets 2xx as soon as the event is durably stored. Customer downtime never causes provider-side loss.
- **ADR-004 Retry policy.** Retry on network error, timeout, 408, 429 (honor Retry-After), 5xx. Other 4xx => `failed` (no auto-retry; manual replay allowed). Delay = full jitter of `min(6 h, 10 s * 2^(n-1))`, max 8 attempts then `dead`.
- **ADR-005 No ORM.** Raw SQL via `pg`: fewer abstractions, fewer LLM hallucinations, explicit queries.
- **ADR-006 Invalid signatures are rejected, not stored.** Avoids storing attacker-controlled data and noisy alerts.
- **ADR-007 Forward original signature headers untouched.** The customer's existing verification code keeps working.

Add new ADRs here during `finalize-task` when a decision changes.
