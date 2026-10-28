# T03 — Crypto & redaction
Reads: 05-security.md 04-conventions.md
Include: src/config.ts

## Goal
Encryption helpers and header redaction.

## Create
src/lib/crypto.ts: `encrypt(plain: Buffer): Buffer`, `decrypt(blob: Buffer): Buffer` (format v1 in docs/05, key from MASTER_KEY),
`sha256Hex(input)`, `generateApiKey()` (prefix `whs_`), `generateSlug()`.
src/lib/redact.ts: `redactHeaders(headers)` (case-insensitive).

## Acceptance
- Round trip works for empty, small and 5 MB buffers
- Tampered ciphertext, truncated blob and wrong key all throw a typed error
- Two encryptions of the same plaintext differ (random IV)
- Redaction removes authorization, cookie, set-cookie, x-api-key regardless of case

## Out of scope
Key rotation.
