import winston from 'winston';
import { env } from '../config/env';

const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const extras = Object.keys(meta).length
      ? `\n  ${JSON.stringify(meta, null, 2).replace(/\n/g, '\n  ')}`
      : '';
    return `[${timestamp}] ${level}: ${message}${extras}`;
  }),
);

const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: env.NODE_ENV === 'production' ? prodFormat : devFormat,
  transports: [new winston.transports.Console()],
});

export function redactSensitive(value: string | null | undefined): string {
  if (!value) return '<null>';
  if (env.NODE_ENV !== 'production') return value;

  if (value.includes('@')) {
    const [local, domain] = value.split('@');
    const masked = local.slice(0, 2).padEnd(local.length, '*');
    const tld = domain.split('.').at(-1) ?? '***';
    return `${masked}@***.${tld}`;
  }

  return `${'*'.repeat(Math.max(0, value.length - 4))}${value.slice(-4)}`;
}

export const createServiceLogger = (service: string) => logger.child({ service });
