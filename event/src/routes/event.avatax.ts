import { Request, Response } from 'express';
import * as http from 'node:https';
import { logger } from '../utils/logger.utils';
import { Order } from '@commercetools/platform-sdk';
import { getData } from '../client/create.client';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';
import { setUpAvaTax } from '../utils/avatax.utils';

export async function avataxTransactionOperations(req: Request, res: Response) {
  try {
    logger.info('Event message received');
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    if (settings.disableDocRec) {
      return res.status(200).send();
    }
    const { creds, originAddress, avataxConfig } = setUpAvaTax(settings, http);

    if (req.body.type === 'OrderCreated') {
      // commit
      const order: Order = req.body.order;
      return await commitTransaction(order, creds, originAddress, avataxConfig)
        .then(() => {
          res.status(200).send();
        })
        .catch((e) => {
          logger.error(e);
          res.status(400).send();
        });
    } else if (
      req.body.type === 'OrderStateChanged' &&
      req.body.orderState === 'Cancelled'
    ) {
      // void
      const orderId: string = req.body.resource.id;
      return await voidTransaction(orderId, creds, avataxConfig)
        .then(() => {
          res.status(200).send();
        })
        .catch((e) => {
          logger.error(e);
          res.status(400).send();
        });
    }
  } catch (e) {
    logger.error(e);
    res.status(400).send();
  }
}
