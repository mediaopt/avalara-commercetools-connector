import { Request } from 'express';
import { avaTaxConfig } from '../avalara/utils/avatax.config';
import * as http from 'node:https';
import { logger } from '../utils/logger.utils';
import { Order } from '@commercetools/platform-sdk';
import { getData } from '../client/create.client';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';

export async function avataxTransactionOperations(req: Request) {
  try {
    logger.info('Event message received');
    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res.settings
    );

    if (!settings.disableDocRec) {
      const creds = {
        username: settings.accountNumber,
        password: settings.licenseKey,
      };
      const originAddress = {
        line1: settings.line1,
        line2: settings.line2,
        line3: settings.line3,
        city: settings.city,
        postalCode: settings.postalCode,
        region: settings.region,
        country: settings.country,
      };
      const avataxConfig = avaTaxConfig(
        settings.env ? 'production' : 'sandbox',
        http
      );

      if (req.body.type === 'OrderCreated') {
        // commit
        const order: Order = req.body.order;
        return await commitTransaction(
          order,
          creds,
          originAddress,
          avataxConfig
        )
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
    }
  } catch (e) {
    logger.error(e);
  }
}
