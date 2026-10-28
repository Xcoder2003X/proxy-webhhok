Review the code below against the task's acceptance criteria and AGENTS.md. Be strict.
Check specifically: raw-body HMAC handling, timing-safe comparison, project_id scoping on every query, SQL parameterization,
secrets/bodies never logged, SSRF, idempotency, error handling, missing tests, `any` usage.
Output a list: CRITICAL / IMPORTANT / MINOR. For each: file, problem, fix (short snippet).
Do not rewrite files that are fine. If everything is fine, say so.

<paste git diff here>
