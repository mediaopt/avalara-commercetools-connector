import { Router } from 'express';
import { post } from '../controllers/event.controller';

const eventRouter: Router = Router();

eventRouter.post('/', (req, res, next) => {
  post(req, res, next);
});

export default eventRouter;
