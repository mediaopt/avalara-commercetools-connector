import { Router } from 'express';
import { post } from '../controllers/service.controller';
import { postTestConnection } from '../controllers/test.connection.controller';
import { postCheckAddress } from '../controllers/check.address.controller';
import {
    createSessionMiddleware,
    CLOUD_IDENTIFIERS,
  } from '@commercetools-backend/express';

const serviceRouter = Router();

serviceRouter.post('/', post);

serviceRouter.use('/:var(test-connection|check-address)',
  createSessionMiddleware({
    audience: process.env.CONNECT_SERVICE_URL || '',
    issuer: CLOUD_IDENTIFIERS.GCP_EU,
  })
);


serviceRouter.post('/test-connection', postTestConnection);

serviceRouter.post('/check-address', postCheckAddress);

export default serviceRouter;
