import { Request, Response, Router } from 'express';
import { post } from '../controllers/event.controller';
import { refundTransaction } from '../avalara/requests/actions/refund.transaction';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import { logger } from '../utils/logger.utils';

const eventRouter: Router = Router();

eventRouter.post('/', post);

eventRouter.post('/refund', async (req: Request, res: Response) => {
  const data = req.body;
  await refundTransaction(
    data.id,
    data.creds,
    data.originAddress,
    avaTaxConfig(data.env)
  ).catch((error) => logger.error(error));

  res.status(200).send();
});

export default eventRouter;
