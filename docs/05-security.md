# 05 — Security

| Threat | Mitigation |
|--------|------------|
| Forged webhooks | HMAC on raw bytes, timing-safe compare (`crypto.timingSafeEqual` after length check), reject with 401, store nothing |
| Replay of old Stripe events | timestamp tolerance 300 s on Stripe scheme |
| Payload exposure at rest | AES-256-GCM per record, random 12-byte IV |
| Secret exposure | signing secrets and alert URLs encrypted with the same module; never returned by the API after creation |
| API key theft | keys `whs_` + 32 random bytes base64url; only sha256 stored; shown once |
| SSRF via destination_url | https only in production; resolve DNS and block loopback, private (10/8, 172.16/12, 192.168/16), link-local (169.254/16 incl. cloud metadata), CGNAT, IPv6 equivalents; re-check at delivery time; no redirects followed |
| Cross-tenant access | every query filtered by `project_id`; tests prove project A cannot read project B |
| DoS | body limit, per-slug rate limit, worker concurrency cap, forward timeout 10 s |
| Log leaks | redact `authorization`, `cookie`, `set-cookie`, `x-api-key` before storing headers; never log bodies |

## body_enc format v1
`[1 byte version=0x01][12 bytes IV][16 bytes GCM tag][ciphertext]`
Key: `MASTER_KEY` env, base64 of 32 bytes. Version byte reserves room for key rotation later.

## Dev exception
`ALLOW_PRIVATE_DESTINATIONS=true` disables SSRF blocking **only** when `NODE_ENV !== 'production'`.
