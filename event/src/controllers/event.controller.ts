import { Request, Response } from 'express';
import { createApiRoot, getData } from '../client/create.client';
import { Order } from '@commercetools/platform-sdk';
import CustomError from '../errors/custom.error';
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
export const post = async (request: Request, response: Response) => {

  let messageType: any = null;
  let order: any = null;
  let orderStatus: any = null;
  let orderId : any = null;
  let creds: any = null;
  let originAddress: any = null;
  let avataxConfig: any = null;

  // Check request body
  if (!request.body) {
    logger.error('Missing request body.');
    throw new CustomError(400, 'Bad request: No Pub/Sub message was received');
  }

  // Check if the body comes in a message
  if (!request.body.message) {
    logger.error('Missing body message');
    throw new CustomError(400, 'Bad request: Wrong No Pub/Sub message format');
  }

  const settings = await getData('avalara-commercetools-connector').then(
    (res) => res?.settings
  ).catch(e => new CustomError(400, 'No Avalara merchant data is present.'));

  if (!settings) {
    throw new CustomError(400, 'No Avalara merchant data is present.')
  }

  if (settings?.disableDocRec) {
    return response.status(204).send();
  }
  try {
    const data = setUpAvaTax(settings);
    creds = data.creds;
    originAddress = data.originAddress;
    avataxConfig = data.avataxConfig;
  } catch (error) {
    throw new CustomError(400, `Bad request: ${error}`);
  }

  // Receive the Pub/Sub message
  const pubSubMessage = request.body.message;

  // For our example we will use the customer id as a var
  // and the query the commercetools sdk with that info
  const decodedData = pubSubMessage.data
    ? Buffer.from(pubSubMessage.data, 'base64').toString().trim()
    : undefined;

  if (decodedData) {
    const jsonData = JSON.parse(decodedData);


    messageType = jsonData?.type;

    if (messageType === 'OrderCreated') {
      order = jsonData?.order;
    } else if (messageType === 'OrderStateChanged') {
      orderStatus = jsonData?.orderState;
      orderId = jsonData?.resource?.id;
    }
  }

  try {
    switch (messageType) {
      case 'OrderCreated':
        if (!order) {
          throw new CustomError(400, `Order must be defined.`);
        }
        await commitTransaction(order, creds, originAddress, avataxConfig)
        break;
      case 'OrderStateChanged':
        if (!(orderStatus === 'Cancelled') || !orderId) {
          throw new CustomError(400, `Order id and/or order status are not defined.`);
        }
        await voidTransaction(orderId, creds, avataxConfig)
        break;
      default: 
        throw new CustomError(400, `Internal Server Error: message type must be one of 'OrderCreated', 'OrderStateChanged'`);
        
    }
    
  } catch (error) {
    throw new CustomError(400, `Bad request: ${error}`);
  }

  // Return the response for the client
  response.status(204).send();
};


