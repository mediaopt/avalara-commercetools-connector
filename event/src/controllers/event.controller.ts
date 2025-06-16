import { NextFunction, Request, Response } from 'express';
import { getCustomObject, getOrder } from '../client/get.client';
import CustomError from '../errors/custom.error';
import {
  Message,
  OrderCreatedMessage,
  OrderEditAppliedMessage,
  OrderReturnShipmentStateChangedMessage,
  OrderStateChangedMessage,
  OrderStateTransitionMessage,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { logger } from '../utils/logger.utils';
import { AvataxTransactionManager } from '../avalara';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import {
  avaTaxConfig,
  extractOriginAddress,
} from '../avalara/helpers/config.helpers';
import { Order } from '@commercetools/platform-sdk';
import { AvataxMerchantConfig } from '../avalara/types/index.types';
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
    const messagePayload = parseRequest(request) as
      | OrderCreatedMessage
      | OrderStateChangedMessage
      | OrderStateTransitionMessage
      | OrderReturnShipmentStateChangedMessage;

    const settings: AvataxMerchantConfig = await getCustomObject(
      'avalara-connector-settings'
    ).then((res) => res?.settings);

    if (!settings) {
      logger.error('Missing Avalara settings.');
      throw new CustomError(400, 'No Avalara merchant data is present.');
    }

    if (settings?.disableDocRec) {
      response.status(200).send();
      return next();
    }

    const transactionManager = new AvataxTransactionManager(
      new AvaTaxClient(
        avaTaxConfig(
          process.env.AVALARA_ENV || 'sandbox',
          settings?.enableLogging,
          settings?.logLevel
        )
      ).withSecurity({
        username: process.env.AVALARA_USERNAME as string,
        password: process.env.AVALARA_PASSWORD as string,
      }),
      process.env.AVALARA_COMPANY_CODE as string,
      extractOriginAddress(settings)
    );

    await handleMessagePayload(messagePayload, settings, transactionManager);

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
    | OrderStateTransitionMessage
    | OrderReturnShipmentStateChangedMessage
    | OrderEditAppliedMessage,
  settings: any,
  transactionManager: AvataxTransactionManager
) => {
  const order: Order =
    (messagePayload as any)?.order ||
    (await getOrder(messagePayload.resource.id));

  if (!order) {
    logger.error(
      `Order not found for message: ${JSON.stringify(messagePayload)}`
    );
    return;
  }

  const country = order?.shippingAddress?.country;
  if (!['US', 'CA'].includes(country || 'default')) {
    return;
  }

  switch (messagePayload.type) {
    case 'OrderCreated':
      await handleOrderCreated(order, settings, transactionManager);
      break;
    case 'OrderStateTransition':
      await handleOrderStateTransition(
        messagePayload,
        order,
        settings,
        transactionManager
      );
      break;
    case 'OrderStateChanged':
      await handleOrderStateChanged(
        messagePayload,
        order,
        settings,
        transactionManager
      );
      break;
    case 'OrderReturnShipmentStateChanged':
      await handleReturnShipmentStateChanged(
        messagePayload,
        order,
        settings,
        transactionManager
      );
      break;
    case 'OrderEditApplied':
      await handleOrderEditApplied(order, transactionManager);
    default:
  }
};

const handleOrderCreated = async (
  order: Order,
  settings: any,
  transactionManager: AvataxTransactionManager
) => {
  try {
    if (settings?.commitOnOrderCreation) {
      await transactionManager.commitTransaction(order);
    }
  } catch (error) {
    logger.error(error);
  }
};

const handleOrderStateTransition = async (
  messagePayload: OrderStateTransitionMessage,
  order: Order,
  settings: any,
  transactionManager: AvataxTransactionManager
) => {
  try {
    if (
      !settings?.commitOnOrderCreation &&
      settings?.commitOrderStates?.includes(messagePayload.state.id)
    ) {
      await transactionManager.commitTransaction(order);
    } else if (
      !settings?.cancelOnOrderCancelation &&
      settings?.cancelOrderStates?.includes(messagePayload.state.id) &&
      messagePayload.resource.id
    ) {
      await transactionManager.voidOrRefundTransaction(order);
    }
  } catch (error) {
    logger.error(error);
  }
};

const handleOrderStateChanged = async (
  messagePayload: OrderStateChangedMessage,
  order: Order,
  settings: any,
  transactionManager: AvataxTransactionManager
) => {
  try {
    if (
      !settings?.commitOnOrderCreation &&
      settings?.commitOrderStates?.includes(
        messagePayload.orderState.toLowerCase()
      )
    ) {
      await transactionManager.commitTransaction(order);
    } else if (
      (!settings?.cancelOnOrderCancelation &&
        settings?.cancelOrderStates?.includes(
          messagePayload.orderState.toLowerCase()
        )) ||
      (settings?.cancelOnOrderCancelation &&
        messagePayload.orderState === 'Cancelled')
    ) {
      await transactionManager.voidOrRefundTransaction(order);
    }
  } catch (error) {
    logger.error(error);
  }
};

const handleReturnShipmentStateChanged = async (
  messagePayload: OrderReturnShipmentStateChangedMessage,
  order: Order,
  settings: any,
  transactionManager: AvataxTransactionManager
) => {
  try {
    if (settings?.activateReturns) {
      await transactionManager.partiallyRefundTransaction(
        messagePayload.returnItemId,
        order
      );
    }
  } catch (error) {
    logger.error(error);
  }
};

const handleOrderEditApplied = async (
  order: Order,
  transactionManager: AvataxTransactionManager
) => {
  try {
    if (!order.taxedPrice) {
      await transactionManager.recalculateTransaction(order);
    }
  } catch (error) {
    logger.error(error);
  }
};
