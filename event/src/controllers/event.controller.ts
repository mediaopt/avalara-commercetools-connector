import { NextFunction, Request, Response } from 'express';
import { getData } from '../client/data.client';
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
import { postProcessing as commitPostProcessing } from '../avalara/requests/postprocess/postprocess.order.commit';
import { postProcessing as refundPostProcessing } from '../avalara/requests/postprocess/postprocess.order.refund';

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
    logger.error('Missing body message.');
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
  logger.error('Missing message payload.');
  throw new CustomError(400, 'Bad request: No payload in the Pub/Sub message');
}

export const post = async (
  request: Request,
  response: Response,
  next: NextFunction
) => {
  try {
    const env = process.env.AVALARA_ENV || 'sandbox';
    const credentials = {
      username: process.env.AVALARA_USERNAME as string,
      password: process.env.AVALARA_PASSWORD as string,
      companyCode: process.env.AVALARA_COMPANY_CODE as string,
    };
    const messagePayload = parseRequest(request) as
      | OrderCreatedMessage
      | OrderStateChangedMessage;

    const settings = await getData('avalara-commercetools-connector').then(
      (res) => res?.settings
    );
    if (!settings) {
      logger.error('Missing Avalara settings.');
      throw new CustomError(400, 'No Avalara merchant data is present.');
    }
    if (settings?.disableDocRec) {
      return response.status(200).send();
    }
    const { originAddress, avataxConfig } = setUpAvaTax(settings, env);

    switch (messagePayload.type) {
      case 'OrderCreated':
        if (!messagePayload.order) {
          throw new CustomError(400, `Order must be defined.`);
        }
        await commitTransaction(
          messagePayload.order,
          credentials,
          originAddress,
          avataxConfig,
          settings.displayPricesWithTax
        )
          .then(
            async (transaction) =>
              await commitPostProcessing(
                messagePayload.order.id,
                messagePayload.order.version,
                transaction
              )
          )
          .catch((error) => logger.error(error));
        response.status(200).send();
        break;
      case 'OrderStateChanged':
        if (
          messagePayload.orderState === 'Cancelled' &&
          messagePayload.resource.id
        ) {
          await voidTransaction(
            messagePayload.resource.id,
            credentials,
            avataxConfig
          ).catch(async (error) => {
            logger.error(error);
            if (error?.code === 'CannotModifyLockedTransaction') {
              await refundTransaction(
                messagePayload.resource.id,
                credentials,
                originAddress,
                avataxConfig,
                settings.displayPricesWithTax
              )
                .then(
                  async (transaction) =>
                    await refundPostProcessing(
                      messagePayload.resource.id,
                      messagePayload.version,
                      transaction
                    )
                )
                .catch((error) => logger.error(error));
            }
          });
        }
        response.status(200).send();
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
