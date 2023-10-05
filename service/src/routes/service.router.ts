import { NextFunction, Request, Response, Router } from 'express';
import { cartUpdate } from './service.get.tax';
import hmacSHA256 from 'crypto-js/hmac-sha256';
import Base64 from 'crypto-js/enc-base64';
import { commitOrder } from './service.commit';
import { voidOrder } from './service.void';

const serviceRouter = Router();

const authorized = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.get('authorization');
  const recalculated = Base64.stringify(hmacSHA256(process.env.CTP_CLIENT_ID || "", process.env.CTP_CLIENT_SECRET || ""));
  const authorized = (authHeader == recalculated)
  if (!authorized || !authHeader) {
    res.sendStatus(401)
  }
  next()
}

serviceRouter.use(authorized)

serviceRouter.post('/get-tax', cartUpdate);

serviceRouter.post('/commit', commitOrder);

serviceRouter.post('/void', voidOrder);


export default serviceRouter;
