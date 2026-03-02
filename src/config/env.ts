import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3000').transform((v) => parseInt(v, 10)),
  API_VERSION: z.string().default('v1'),
  DATABASE_URL: z.string().url(),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error']).default('info'),
  DB_TRANSACTION_TIMEOUT: z.string().default('10000').transform((v) => parseInt(v, 10)),
});

const result = envSchema.safeParse(process.env);

if (!result.success) {
  console.error('Missing or invalid environment variables:');
  console.error(result.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = result.data;
