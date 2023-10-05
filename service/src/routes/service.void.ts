import { logger } from '../utils/logger.utils';
import { getData } from '../client/create.client';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import * as http from 'node:https';
import { Order } from '@commercetools/platform-sdk';
import { Request, Response } from 'express';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';

export async function voidOrder(req: Request, res: Response) {
    logger.info('Order update extension executed');
    // Get credentials and configuration
    const creds = await getData('avalaraCreds');
    const ctConfig = await getData('avalaraConfiguration');
    const avataxConfig = avaTaxConfig(ctConfig.env, http);
    const order: Order = req.body?.resource?.obj;
    if (order.orderState === "Cancelled") {
        return await voidTransaction(order, creds, avataxConfig)
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
  }