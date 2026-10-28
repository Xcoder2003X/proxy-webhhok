export type HeaderValue = string | string[] | undefined;
export type HeaderMap = Readonly<Record<string, HeaderValue>>;

const sensitiveHeaders = new Set(['authorization', 'cookie', 'set-cookie', 'x-api-key']);

export function redactHeaders(headers: HeaderMap): Record<string, HeaderValue> {
  const redacted: Record<string, HeaderValue> = {};

  for (const [name, value] of Object.entries(headers)) {
    if (!sensitiveHeaders.has(name.toLowerCase())) {
      redacted[name] = value;
    }
  }

  return redacted;
}
