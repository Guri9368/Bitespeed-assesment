import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env';
import { logger } from './utils/logger';
import { globalErrorHandler } from './middlewares/errorHandler';
import contactRoutes from './routes/contact.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.NODE_ENV === 'production' ? [] : '*',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev', {
    stream: { write: (msg) => logger.http(msg.trim()) },
  }));


  app.use('/', contactRoutes);
  app.use(`/api/${env.API_VERSION}/contact`, contactRoutes);

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ status: 'error', message: 'Route not found' });
  });

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    globalErrorHandler(err, req, res, next);
  });

  return app;
}
