import { NextFunction, Request, Response, Router } from 'express';
import { post } from '../controllers/service.controller';
import { postTestConnection } from '../controllers/test.connection.controller';
import { postCheckAddress } from '../controllers/check.address.controller';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../utils/logger.utils';
import CustomError from '../errors/custom.error';
import { MC_API_URLS } from '../utils/consts.utils';

const serviceRouter = Router();

serviceRouter.post('/', post);

serviceRouter.use(
  '/:var(test-connection|check-address)',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const token = (req.get('authorization') as string).split(' ')[1];
      if (req.get('origin')?.includes('commercetools.com')) {
        const payload = jwt.decode(token) as any;
        if (!MC_API_URLS.includes(payload.iss)) {
          throw new CustomError(401, 'Non-trusted issuer.');
        }
        const client = jwksClient({
          jwksUri: `${payload.iss}/.well-known/jwks.json`,
        });
        const key = await client.getSigningKey();
        const signingKey = key.getPublicKey();
        jwt.verify(token, signingKey);
        return next();
      }
      const apiKey = process.env.AVALARA_FRONTEND_API_KEY as string;
      jwt.verify(token, apiKey);
    } catch (error) {
      logger.error(error);
      return res.status(401).send('Unauthorized');
    }
    next();
  }
);

serviceRouter.post('/test-connection', postTestConnection);

serviceRouter.post('/check-address', postCheckAddress);

export default serviceRouter;
