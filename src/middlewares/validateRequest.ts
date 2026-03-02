import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from './errorHandler';

export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.is('application/json')) {
      return next(new AppError('Content-Type must be application/json', 415));
    }

    if (req.body === null || typeof req.body !== 'object' || Array.isArray(req.body)) {
      return next(new AppError('Request body must be a JSON object', 400));
    }

    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        next(err);
      } else {
        next(new Error('Validation failed unexpectedly'));
      }
    }
  };
}
