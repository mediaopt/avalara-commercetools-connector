import { Request, Router } from 'express';
import { post } from '../controllers/service.controller';
import { postTestConnection } from '../controllers/test.connection.controller';
import { postCheckAddress } from '../controllers/check.address.controller';
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';

const serviceRouter = Router();

serviceRouter.post('/', post);

serviceRouter.use('/:var(test-connection|check-address)', async (req: Request, res, next) => {
    try {
        if (req.get('origin') === process.env.FRONTEND_URL) {
            // do some clever authorization here
        }
        const token = (req.get('authorization') as string).split(' ')[1];
        const payload = jwt.decode(token) as any
        const client = jwksClient({
            jwksUri: `${payload.iss}/.well-known/jwks.json`,
        });
        const key = await client.getSigningKey();
        const signingKey = key.getPublicKey();
        jwt.verify(token, signingKey)
    } catch (e) {
        return res.status(401).send('Unauthorized');
    }
    next()
});


serviceRouter.post('/test-connection', postTestConnection);

serviceRouter.post('/check-address', postCheckAddress);

export default serviceRouter;
