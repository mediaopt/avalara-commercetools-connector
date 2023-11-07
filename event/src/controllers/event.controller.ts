import { Request, Response } from 'express';
import { getData } from '../client/create.client';
import CustomError from '../errors/custom.error';
import {
  MessagePayload,
  OrderCreatedMessagePayload,
  OrderStateChangedMessagePayload
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import { logger } from '../utils/logger.utils';
import { setUpAvaTax } from '../utils/avatax.utils';
import { commitTransaction } from '../avalara/requests/actions/commit.transaction';
import { voidTransaction } from '../avalara/requests/actions/void.transaction';

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
    logger.info(`Message received: ${pubSubMessage}`)
    logger.info(`Payload received: ${decodedData}`);
    return JSON.parse(decodedData) as MessagePayload;
  }
  throw new CustomError(400, 'Bad request: No payload in the Pub/Sub message');
}


export const post = async (request: Request, response: Response) => {
  try {
  const settings = await getData('avalara-commercetools-connector').then(
    (res) => res?.settings
  ).catch(e => new CustomError(400, e));
  if (!settings) {
    throw new CustomError(400, 'No Avalara merchant data is present.')
  }
  if (settings?.disableDocRec) {
    return response.status(204).send();
  }
  let { creds, originAddress, avataxConfig } = setUpAvaTax(settings);

  const messagePayload = parseRequest(request) as OrderCreatedMessagePayload | OrderStateChangedMessagePayload
  switch (messagePayload.type) {
    case 'OrderCreated':
      if (!messagePayload.order) {
        throw new CustomError(400, `Order must be defined.`);
      }
      await commitTransaction(messagePayload.order, creds, originAddress, avataxConfig)
      break;
    case 'OrderStateChanged':
      if (!(messagePayload.orderState === 'Cancelled')) {
        //await voidTransaction(orderId, creds, avataxConfig)
      }
      break;
    default: 
      throw new CustomError(400, `Internal Server Error: message type must be one of 'OrderCreated', 'OrderStateChanged'`);
    }
    
  } catch (error) {
    throw new CustomError(400, `Internal Server error: ${error}`);
  }

  // Return the response for the client
  response.status(204).send();
};


