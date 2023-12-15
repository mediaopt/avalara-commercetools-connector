import { Router } from 'express';
import { post } from '../controllers/service.controller';
import { postTestConnection } from '../controllers/test.connection.controller';
import { postCheckAddress } from '../controllers/check.address.controller';

const serviceRouter = Router();

serviceRouter.post('/', (req, res, next) => {
  post(req, res, next);
});

serviceRouter.post('/test-connection', (req, res, next) => {
  postTestConnection(req, res, next);
});

serviceRouter.post('/check-address', (req, res, next) => {
  postCheckAddress(req, res, next);
});

export default serviceRouter;
