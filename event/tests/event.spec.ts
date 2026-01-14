import {
  describe,
  expect,
  jest,
  beforeEach,
  it,
  afterEach,
} from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { post } from '../src/controllers/event.controller';
import { getCustomObject, getOrder } from '../src/client/get.client';
import { AvataxTransactionManager } from '@mediaopt/avalara-commercetools-lib';
import {
  OrderCreatedMessage,
  OrderStateChangedMessage,
  OrderStateTransitionMessage,
  OrderReturnShipmentStateChangedMessage,
} from '@commercetools/platform-sdk/dist/declarations/src/generated/models/message';
import CustomError from '../src/errors/custom.error';
import { Order } from '@commercetools/platform-sdk';
import { order } from './order.test.data';

jest.mock('../src/client/get.client');
jest.mock('@mediaopt/avalara-commercetools-lib');
jest.mock('../src/utils/logger.utils');

const mockGetCustomObject = getCustomObject as jest.MockedFunction<
  typeof getCustomObject
>;
const mockGetOrder = getOrder as jest.MockedFunction<typeof getOrder>;

// create mock random order number
const getRandomNumber = (): string => {
  return `jest_test_${Math.random().toString(36).slice(2)}`;
};

describe('event.controller', () => {
  let request: Partial<Request>;
  let response: Partial<Response>;
  let next: NextFunction;
  let mockCommitTransaction: any;
  let mockVoidOrRefundTransaction: any;
  let mockPartiallyRefundTransaction: any;

  beforeEach(() => {
    request = {
      body: {
        message: {
          data: Buffer.from(
            JSON.stringify({ resource: { id: 'order-id' } })
          ).toString('base64'),
        },
      },
    };

    response = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    } as unknown as Response;

    next = jest.fn();

    mockCommitTransaction = jest.spyOn(
      AvataxTransactionManager.prototype,
      'commitTransaction'
    );
    mockVoidOrRefundTransaction = jest.spyOn(
      AvataxTransactionManager.prototype,
      'voidOrRefundTransaction'
    );
    mockPartiallyRefundTransaction = jest.spyOn(
      AvataxTransactionManager.prototype,
      'partiallyRefundTransaction'
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  describe('post', () => {
    it('should handle OrderCreatedMessage', async () => {
      const messagePayload: OrderCreatedMessage = {
        type: 'OrderCreated',
        resource: { id: 'order-id' },
      } as any;

      request.body.message.data = Buffer.from(
        JSON.stringify(messagePayload)
      ).toString('base64');

      mockGetCustomObject.mockResolvedValue({
        settings: { commitOnOrderCreation: true },
      });
      mockGetOrder.mockResolvedValue(
        order({
          orderNumber: getRandomNumber(),
          country: 'US',
        }) as unknown as Order
      );

      await post(request as Request, response as Response, next);
      expect(mockCommitTransaction).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalled();
      expect(response.send).toHaveBeenCalled();
    });

    it('should handle OrderStateTransitionMessage', async () => {
      const messagePayload: OrderStateTransitionMessage = {
        type: 'OrderStateTransition',
        resource: { id: 'order-id' },
        state: { id: 'state-id' },
      } as any;

      request.body.message.data = Buffer.from(
        JSON.stringify(messagePayload)
      ).toString('base64');

      mockGetCustomObject.mockResolvedValue({
        settings: { commitOrderStates: ['state-id'] },
      });
      mockGetOrder.mockResolvedValue({
        id: 'order-id',
        shippingAddress: { country: 'US' },
      } as Order);

      await post(request as Request, response as Response, next);

      expect(mockCommitTransaction).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
    });

    it('should handle OrderStateChangedMessage', async () => {
      const messagePayload: OrderStateChangedMessage = {
        type: 'OrderStateChanged',
        resource: { id: 'order-id' },
        orderState: 'Cancelled',
      } as any;

      request.body.message.data = Buffer.from(
        JSON.stringify(messagePayload)
      ).toString('base64');

      mockGetCustomObject.mockResolvedValue({
        settings: { cancelOrderStates: ['cancelled'] },
      });
      mockGetOrder.mockResolvedValue({
        id: 'order-id',
        shippingAddress: { country: 'US' },
      } as Order);

      await post(request as Request, response as Response, next);

      expect(mockVoidOrRefundTransaction).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
    });

    it('should handle OrderReturnShipmentStateChangedMessage', async () => {
      const messagePayload: OrderReturnShipmentStateChangedMessage = {
        type: 'OrderReturnShipmentStateChanged',
        resource: { id: 'order-id' },
        returnItemId: 'return-item-id',
      } as any;

      request.body.message.data = Buffer.from(
        JSON.stringify(messagePayload)
      ).toString('base64');

      mockGetCustomObject.mockResolvedValue({
        settings: { activateReturns: true },
      });
      mockGetOrder.mockResolvedValue({
        id: 'order-id',
        shippingAddress: { country: 'US' },
      } as Order);

      await post(request as Request, response as Response, next);

      expect(mockPartiallyRefundTransaction).toHaveBeenCalled();
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
    });

    it('should handle missing request body', async () => {
      request.body = undefined;

      await post(request as Request, response as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it('should handle missing message in request body', async () => {
      request.body = {};

      await post(request as Request, response as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it('should handle missing payload in message', async () => {
      request.body = { message: {} };

      await post(request as Request, response as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it('should handle missing Avalara settings', async () => {
      mockGetCustomObject.mockResolvedValue(undefined);

      await post(request as Request, response as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(CustomError));
    });

    it('should handle disableDocRec setting', async () => {
      mockGetCustomObject.mockResolvedValue({
        settings: { disableDocRec: true },
      });

      await post(request as Request, response as Response, next);

      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.send).toHaveBeenCalled();
      expect(next).toHaveBeenCalled();
    });
  });
});
