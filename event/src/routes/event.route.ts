import { Router } from 'express';
import { avataxTransactionOperations } from './event.avatax';

const eventRouter: Router = Router();

eventRouter.post('/', avataxTransactionOperations);

export default eventRouter;
