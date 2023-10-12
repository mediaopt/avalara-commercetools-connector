import { Router } from 'express';
import { cartUpdate } from './service.get.tax';

const serviceRouter = Router();

serviceRouter.post('/', cartUpdate);

export default serviceRouter;
