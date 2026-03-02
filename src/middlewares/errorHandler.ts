import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger';
import { env } from '../config/env';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFound = (resource: string) => new AppError(`${resource} not found`, 404);
export const badRequest = (msg: string) => new AppError(msg, 400);
export const conflict = (msg: string) => new AppError(msg, 409);

export const globalErrorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof ZodError) {
    const errors = err.issues.map((i) => ({
      field: i.path.join('.') || 'body',
      message: i.message,
    }));
    res.status(400).json({ status: 'error', message: 'Validation failed', errors });
    return;
  }

  if (err instanceof AppError) {
    if (!err.isOperational) {
      logger.error('AppError (non-operational)', {
        message: err.message,
        stack: err.stack,
        path: req.path,
      });
    }
    res.status(err.statusCode).json({ status: 'error', message: err.message });
    return;
  }

  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(500).json({
    status: 'error',
    message: env.NODE_ENV === 'production' ? 'Something went wrong' : err.message,
  });
};
