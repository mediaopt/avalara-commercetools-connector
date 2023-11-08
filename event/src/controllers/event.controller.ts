import { NextFunction, Request, Response } from 'express';
import { getData } from '../client/create.client';
import CustomError from '../errors/custom.error';
import {
  Message,
  OrderCreatedMessage,
  OrderStateChangedMessage,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { logger } from '../utils/logger.utils';
import { setUpAvaTax } from '../utils/avatax.utils';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';
import { refundTransaction } from '../avalara/requests/actions/refund.transaction';

/**
 * Exposed event POST endpoint.
 * Receives the Pub/Sub message and works with it
 *
 * @param {Request} request The express request
 * @param {Response} response The express response
 * @returns
 */

function parseRequest(request: Request) {
  if (!request.body) {
    logger.error('Missing request body.');
    throw new CustomError(400, 'Bad request: No Pub/Sub message was received');
  }
  if (!request.body.message) {
    logger.error('Missing body message');
    throw new CustomError(400, 'Bad request: Wrong No Pub/Sub message format');
  }
  const pubSubMessage = request.body.message;
  const decodedData = pubSubMessage.data
    ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
    : undefined;
  if (decodedData) {
    logger.info(`Payload received: ${decodedData}`);
    return JSON.parse(decodedData) as Message;
  }
  throw new CustomError(400, 'Bad request: No payload in the Pub/Sub message');
}

export const post = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const settings = await getData('avalara-commercetools-connector')
      .then((res) => res?.settings)
      .catch((e) => new CustomError(400, e));
    if (!settings) {
      throw new CustomError(400, 'No Avalara merchant data is present.');
    }
    if (settings?.disableDocRec) {
      return response.status(200).send();
    }
    let { creds, originAddress, avataxConfig } = setUpAvaTax(settings);

    const messagePayload = parseRequest(request) as
      | OrderCreatedMessage
      | OrderStateChangedMessage;
    switch (messagePayload.type) {
      case 'OrderCreated':
        if (!messagePayload.order) {
          throw new CustomError(400, `Order must be defined.`);
        }
        await commitTransaction(
          messagePayload.order,
          creds,
          originAddress,
          avataxConfig
        )
        .catch(error => logger.error(error));
        response.status(200).send();
        break;
      case 'OrderStateChanged':
        if (
          messagePayload.orderState === 'Cancelled' &&
          messagePayload.resource.id
        ) {
          await voidTransaction(
            messagePayload.resource.id,
            creds,
            avataxConfig
          )
          .catch(async (error) => {
            logger.error(error);
            await refundTransaction(messagePayload.resource.id, creds, avataxConfig)
            .catch(error => logger.error(error))
          });
          response.status(200).send();
        }
        break;
      default:
        response.status(200).send();
    }
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(400, error.message));
    } else {
      next(error);
    }
  }
};
