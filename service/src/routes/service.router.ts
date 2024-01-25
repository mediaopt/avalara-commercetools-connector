import { Router } from 'express';
import { post } from '../controllers/service.controller';
import { postTestConnection } from '../controllers/test.connection.controller';
import { postCheckAddress } from '../controllers/check.address.controller';
import { verifyJWT } from '../middleware/auth.middleware';

const serviceRouter = Router();

serviceRouter.use('/:var(test-connection|check-address)', verifyJWT);

serviceRouter.post('/', post);

serviceRouter.post('/test-connection', postTestConnection);

serviceRouter.post('/check-address', postCheckAddress);

export default serviceRouter;
