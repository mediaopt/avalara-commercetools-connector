import { Request } from 'express';
import * as http from 'node:https';
import { logger } from '../utils/logger.utils';
import { Order } from '@commercetools/platform-sdk';
import { getData } from '../client/create.client';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';
import { setUpAvaTax } from '../utils/avatax.utils';

export async function avataxTransactionOperations(req: Request) {
  try {
    logger.info('Event message received');
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    if (settings.disableDocRec) {
      return;
    }
    const { creds, originAddress, avataxConfig } = setUpAvaTax(settings, http);

    if (req.body.type === 'OrderCreated') {
      // commit
      const order: Order = req.body.order;
      return await commitTransaction(order, creds, originAddress, avataxConfig)
        .then(() => {
          // setting custom field to committed?
        })
        .catch((e) => {
          logger.error(e);
        });
    } else if (
      req.body.type === 'OrderStateChanged' &&
      req.body.orderState === 'Cancelled'
    ) {
      // void
      const orderId: string = req.body.resource.id;
      return await voidTransaction(orderId, creds, avataxConfig)
        .then(() => {
          // setting custom field to voided?
        })
        .catch((e) => {
          logger.error(e);
        });
    }
  } catch (e) {
    logger.error(e);
  }
}
