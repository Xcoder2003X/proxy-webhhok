import { describe, expect, it } from 'vitest';
import { redactHeaders } from '../../src/lib/redact.js';

describe('redactHeaders', () => {
  it('removes sensitive headers regardless of name casing', () => {
    const redacted = redactHeaders({
      Authorization: 'Bearer secret',
      COOKIE: 'session=secret',
      'Set-Cookie': ['session=secret; HttpOnly'],
      'X-API-KEY': 'secret-key',
      'Content-Type': 'application/json',
      'X-Request-Id': 'request-123',
    });

    expect(redacted).toEqual({
      'Content-Type': 'application/json',
      'X-Request-Id': 'request-123',
    });
  });

  it('preserves non-sensitive headers and their values', () => {
    const headers = {
      accept: 'application/json',
      'x-signature': ['sha256=abc', 'sha256=def'],
    };

    expect(redactHeaders(headers)).toEqual(headers);
  });
});
