import 'dotenv/config';
import z from 'zod';

const EnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  HOST: z.string().min(1).default('localhost'),
  PORT: z.coerce.number().int().min(1).max(65535).default(55100),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .optional(),
  CORS_ORIGIN: z.string().optional(),
  // Any unique UUID (v4 is fine) used as the namespace for scanner ids.
  SCANNER_NAMESPACE: z.uuid(),
});

export type Env = z.infer<typeof EnvSchema>;

let cached: Env | undefined;

/**
 * Parses and validates environment variables on first access.
 * Missing or invalid values fail fast with a human-readable message.
 */
export function getEnv(): Env {
  if (!cached) {
    const parsed = EnvSchema.safeParse(process.env);
    if (!parsed.success) {
      const issues = parsed.error.issues
        .map(
          (issue) =>
            `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`,
        )
        .join('\n');
      throw new Error(
        `Invalid environment configuration:\n${issues}\n\n` +
          'Copy .env.example to .env and fill in the required values.',
      );
    }
    cached = parsed.data;
  }
  return cached;
}
