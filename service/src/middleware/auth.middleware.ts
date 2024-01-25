import { type AuthMiddlewareOptions } from '@commercetools/sdk-client-v2'; // Required for auth
import { readConfiguration } from '../utils/config.utils';
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { logger } from '../utils/logger.utils';
import CustomError from '../errors/custom.error';
import { MC_API_URLS } from '../utils/consts.utils';
/**
 * Configure Middleware. Example only. Adapt on your own
 */
export const authMiddlewareOptions: AuthMiddlewareOptions = {
  host: `https://auth.${readConfiguration().region}.commercetools.com`,
  projectKey: readConfiguration().projectKey,
  credentials: {
    clientId: readConfiguration().clientId,
    clientSecret: readConfiguration().clientSecret,
  },
  scopes: [
    readConfiguration().scope
      ? (readConfiguration().scope as string)
      : 'default',
  ],
};

export async function verifyJWT(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = (req.get('authorization') as string).split(' ')[1];
    if (!req.get('origin')?.includes('commercetools.com')) {
      const apiKey = process.env.AVALARA_FRONTEND_API_KEY as string;
      if (!apiKey) {
        throw new CustomError(401, 'No external communication allowed.');
      }
      jwt.verify(token, apiKey);
      return next();
    }
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
  } catch (error) {
    logger.error(error);
    return res.status(401).send('Unauthorized');
  }
  next();
}
