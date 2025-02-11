import { NextFunction, Request, Response } from 'express';
import { getData, getOrder } from '../client/data.client';
import CustomError from '../errors/custom.error';
import {
  Message,
  OrderCreatedMessage,
  OrderStateChangedMessage,
  OrderStateTransitionMessage,
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
    const creds = {
      username: process.env.AVALARA_USERNAME as string,
      password: process.env.AVALARA_PASSWORD as string,
      companyCode: process.env.AVALARA_COMPANY_CODE as string,
    };

    const messagePayload = parseRequest(request) as
      | OrderCreatedMessage
      | OrderStateChangedMessage
      | OrderStateTransitionMessage;

    const settings = await getData('avalara-connector-settings').then(
      (res) => res?.settings
    );

    if (!settings) {
      logger.error('Missing Avalara settings.');
      throw new CustomError(400, 'No Avalara merchant data is present.');
    }

    if (settings?.disableDocRec) {
      response.status(200).send();
      return next();
    }

    const { originAddress, avataxConfig } = setUpAvaTax(settings, env);

    await handleMessagePayload(
      messagePayload,
      settings,
      creds,
      originAddress,
      avataxConfig
    );

    response.status(200).send();
  } catch (error) {
    if (error instanceof Error) {
      next(new CustomError(400, error.message));
    } else {
      next(error);
    }
  }
};

const handleMessagePayload = async (
  messagePayload:
    | OrderCreatedMessage
    | OrderStateChangedMessage
    | OrderStateTransitionMessage,
  settings: any,
  creds: any,
  originAddress: any,
  avataxConfig: any
) => {
  switch (messagePayload.type) {
    case 'OrderCreated':
      await handleOrderCreated(
        messagePayload,
        settings,
        creds,
        originAddress,
        avataxConfig
      );
      break;
    case 'OrderStateTransition':
      await handleOrderStateTransition(
        messagePayload,
        settings,
        creds,
        originAddress,
        avataxConfig
      );
      break;
    case 'OrderStateChanged':
      await handleOrderStateChanged(
        messagePayload,
        settings,
        creds,
        originAddress,
        avataxConfig
      );
      break;
    default:
      break;
  }
};

const handleOrderCreated = async (
  messagePayload: OrderCreatedMessage,
  settings: any,
  creds: any,
  originAddress: any,
  avataxConfig: any
) => {
  if (!messagePayload.order) {
    throw new CustomError(400, `Order must be defined.`);
  }
  if (settings?.commitOnOrderCreation) {
    await commitTransaction(
      messagePayload.order,
      creds,
      originAddress,
      avataxConfig
    ).catch((error) => logger.error(error));
  }
};

const handleOrderStateTransition = async (
  messagePayload: OrderStateTransitionMessage,
  settings: any,
  creds: any,
  originAddress: any,
  avataxConfig: any
) => {
  if (
    settings?.commitOrderStates?.includes(messagePayload.state.id) &&
    messagePayload.resource.id
  ) {
    const order = await getOrder(messagePayload.resource.id);
    await commitTransaction(order, creds, originAddress, avataxConfig).catch(
      (error) => logger.error(error)
    );
  }
  if (
    settings?.cancelOrderStates?.includes(messagePayload.state.id) &&
    messagePayload.resource.id
  ) {
    await voidOrRefundTransaction(
      messagePayload.resource.id,
      creds,
      originAddress,
      avataxConfig
    );
  }
};

const handleOrderStateChanged = async (
  messagePayload: OrderStateChangedMessage,
  settings: any,
  creds: any,
  originAddress: any,
  avataxConfig: any
) => {
  if (
    settings?.commitOrderStates?.includes(messagePayload.orderState.toLowerCase()) &&
    messagePayload.resource.id
  ) {
    const order = await getOrder(messagePayload.resource.id);
    await commitTransaction(order, creds, originAddress, avataxConfig).catch(
      (error) => logger.error(error)
    );
  }
  if (
    (settings?.cancelOrderStates?.includes(messagePayload.orderState.toLowerCase()) ||
      (settings?.cancelOnOrderCancelation &&
        messagePayload.orderState === 'Cancelled')) &&
    messagePayload.resource.id
  ) {
    await voidOrRefundTransaction(
      messagePayload.resource.id,
      creds,
      originAddress,
      avataxConfig
    );
  }
};

const voidOrRefundTransaction = async (
  resourceId: string,
  creds: any,
  originAddress: any,
  avataxConfig: any
) => {
  await voidTransaction(resourceId, creds, avataxConfig).catch(
    async (error) => {
      logger.error(error);
      if (error?.code === 'CannotModifyLockedTransaction') {
        await refundTransaction(
          resourceId,
          creds,
          originAddress,
          avataxConfig
        ).catch((error) => logger.error(error));
      }
    }
  );
};
