import { Router } from 'express';
import { cartUpdate } from './service.cart.update';

const serviceRouter = Router();

serviceRouter.post('/', cartUpdate);

export default serviceRouter;
