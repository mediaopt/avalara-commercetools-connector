import {
  getCustomObject,
  getShippingMethod,
  getCustomer,
  getCategories,
  getProductProjections,
  getOrder,
} from '../src/client/data.client';
import { logger } from '../src/utils/logger.utils';
import { Order } from '@commercetools/platform-sdk';
import { describe, expect, jest, beforeEach, it } from '@jest/globals';

const mockCreateApiRoot: any = {
  customObjects: jest.fn(() => mockCreateApiRoot),
  shippingMethods: jest.fn(() => mockCreateApiRoot),
  customers: jest.fn(() => mockCreateApiRoot),
  productProjections: jest.fn(() => mockCreateApiRoot),
  categories: jest.fn(() => mockCreateApiRoot),
  orders: jest.fn(() => mockCreateApiRoot),
  search: jest.fn(() => mockCreateApiRoot),
  withId: jest.fn(() => mockCreateApiRoot),
  withContainer: jest.fn(() => mockCreateApiRoot),
  get: jest.fn(() => mockCreateApiRoot),
  execute: jest.fn(() => ({ body: { results: [] } })),
};
jest.mock('../src/client/create.client', () => {
  return {
    createApiRoot: () => mockCreateApiRoot,
  };
});

jest.mock('../src/utils/logger.utils');

describe('data.client', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCustomObject', () => {
    it('should return custom object data', async () => {
      const mockResponse = {
        body: {
          results: [
            { key: 'key1', value: 'value1' },
            { key: 'key2', value: 'value2' },
          ],
        },
      };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getCustomObject('container');
      expect(result).toEqual({ key1: 'value1', key2: 'value2' });
    });

    it('should log error and return undefined on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });
      const result = await getCustomObject('container');
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toBeUndefined();
    });
  });

  describe('getShippingMethod', () => {
    it('should return shipping method data', async () => {
      const mockResponse = { body: { id: 'shippingMethodId' } };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getShippingMethod('shippingMethodId');
      expect(result).toEqual(mockResponse.body);
    });

    it('should log error and return undefined on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });
      const result = await getShippingMethod('shippingMethodId');
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toBeUndefined();
    });
  });

  describe('getCustomer', () => {
    it('should return customer data', async () => {
      const mockResponse = { body: { id: 'customerId' } };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getCustomer('customerId');
      expect(result).toEqual(mockResponse.body);
    });

    it('should log error and return undefined on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });
      const result = await getCustomer('customerId');
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toBeUndefined();
    });
  });

  describe('getCategories', () => {
    it('should return categories data', async () => {
      const mockResponse = { body: { results: [{ id: 'categoryId' }] } };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getCategories(['categoryId']);
      expect(result).toEqual(mockResponse.body.results);
    });

    it('should log error and return empty array on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });

      const result = await getCategories(['categoryId']);
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toEqual([]);
    });
  });

  describe('getProductProjections', () => {
    it('should return product projections data', async () => {
      const mockResponse = { body: { results: [{ id: 'productId' }] } };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getProductProjections(['productId']);
      expect(result).toEqual(mockResponse.body.results);
    });

    it('should log error and return empty array on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });
      const result = await getProductProjections(['productId']);
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toEqual([]);
    });
  });

  describe('getOrder', () => {
    it('should return order data', async () => {
      const mockResponse = { body: { id: 'orderId' } };
      mockCreateApiRoot.execute = jest.fn(() => mockResponse);
      const result = await getOrder('orderId');
      expect(result).toEqual(mockResponse.body);
    });

    it('should log error and return empty order object on failure', async () => {
      mockCreateApiRoot.execute = jest.fn(() => {
        throw new Error('error');
      });
      const result = await getOrder('orderId');
      expect(logger.error).toHaveBeenCalledWith(new Error('error'));
      expect(result).toEqual({} as Order);
    });
  });
});
