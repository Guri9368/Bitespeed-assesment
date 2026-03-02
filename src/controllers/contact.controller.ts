import { Request, Response, NextFunction } from 'express';
import { contactService } from '../services/contact.service';
import { IdentifySchemaInput } from '../schemas/contact.schema';
import { createServiceLogger, redactSensitive } from '../utils/logger';

const log = createServiceLogger('contact-controller');

const identify = async (
  req: Request<Record<string, never>, unknown, IdentifySchemaInput>,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const start = Date.now();

  try {
    const { email, phoneNumber } = req.body;

    log.info('POST /identify', {
      email: redactSensitive(email ?? undefined),
      phoneNumber: redactSensitive(phoneNumber ?? undefined),
    });

    const result = await contactService.identify({ email, phoneNumber });

    log.info('identify done', {
      primaryContactId: result.contact.primaryContactId,
      durationMs: Date.now() - start,
    });

    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
};

export const contactController = { identify };
