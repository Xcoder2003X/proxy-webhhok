import { z } from 'zod';

const postgresUrl = z
  .string()
  .url()
  .refine(
    (value) => value.startsWith('postgres://') || value.startsWith('postgresql://'),
    'must use the postgres:// or postgresql:// scheme',
  );

const masterKey = z.string().refine(
  (value) => {
    const decoded = Buffer.from(value, 'base64');
    return decoded.length === 32 && decoded.toString('base64') === value;
  },
  'must be valid Base64 encoding of exactly 32 bytes',
);

const environmentSchema = z.object({
  DATABASE_URL: postgresUrl,
  TEST_DATABASE_URL: postgresUrl,
  MASTER_KEY: masterKey,
  PORT: z.coerce.number().int().min(1).max(65535).default(3000),
  MAX_BODY_BYTES: z.coerce.number().int().positive().default(1_048_576),
  ALLOW_PRIVATE_DESTINATIONS: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
});

export type AppConfig = {
  databaseUrl: string;
  testDatabaseUrl: string;
  masterKey: Buffer;
  port: number;
  maxBodyBytes: number;
  allowPrivateDestinations: boolean;
  logLevel: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
};

export function loadMasterKey(env: NodeJS.ProcessEnv): Buffer {
  const result = masterKey.safeParse(env.MASTER_KEY);

  if (!result.success) {
    throw new Error('Invalid MASTER_KEY: must be valid Base64 encoding of exactly 32 bytes');
  }

  return Buffer.from(result.data, 'base64');
}

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const result = environmentSchema.safeParse(env);

  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
      .join('; ');
    throw new Error(`Invalid environment configuration: ${details}`);
  }

  return {
    databaseUrl: result.data.DATABASE_URL,
    testDatabaseUrl: result.data.TEST_DATABASE_URL,
    masterKey: loadMasterKey(env),
    port: result.data.PORT,
    maxBodyBytes: result.data.MAX_BODY_BYTES,
    allowPrivateDestinations: result.data.ALLOW_PRIVATE_DESTINATIONS,
    logLevel: result.data.LOG_LEVEL,
  };
}
