import { Request, Response, Router } from 'express';
import { post } from '../controllers/event.controller';
import { refundTransaction } from '../avalara/requests/actions/refund.transaction';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { logger } from '../utils/logger.utils';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';

const eventRouter: Router = Router();

eventRouter.post('/', post);

export default eventRouter;
