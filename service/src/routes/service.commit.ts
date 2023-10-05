import { logger } from '../utils/logger.utils';
import { getData } from '../client/create.client';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import * as http from 'node:https';
import { Order } from '@commercetools/platform-sdk';
import { Request, Response } from 'express';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';

export async function commitOrder(req: Request, res: Response) {
    logger.info('Order create extension executed');
    // Get credentials and configuration
    const creds = await getData('avalaraCreds');
    const ctConfig = await getData('avalaraConfiguration');
    const avataxConfig = avaTaxConfig(ctConfig.env, http);
    const order: Order = req.body?.resource?.obj;
    return await commitTransaction(order, creds, avataxConfig)
      .then(() => {
        res.status(200).send();
      })
      .catch((e) => {
        console.log(e);
        res.status(500).json({
          errors: [
            {
              code: 'General',
              message: 'Internal server error',
            },
          ],
        });
    });
  }