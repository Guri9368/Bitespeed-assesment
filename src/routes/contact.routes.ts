import { Router } from 'express';
import { contactController } from '../controllers/contact.controller';
import { validateRequest } from '../middlewares/validateRequest';
import { identifySchema } from '../schemas/contact.schema';

const router = Router();

router.post('/identify', validateRequest(identifySchema), contactController.identify);

export default router;
