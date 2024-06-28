import { describe, expect, test, jest, afterEach } from '@jest/globals';
import {
  getData,
  getShipTaxCode,
  getCustomerEntityUseCode,
  getBulkCategoryTaxCode,
  getBulkProductCategories,
  getOrder,
} from '../src/client/data.client';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  orderRequest,
  shipTaxCodeBody,
} from './test.data';

const apiRoot: any = {
  customObjects: jest.fn(() => apiRoot),
  shippingMethods: jest.fn(() => apiRoot),
  customers: jest.fn(() => apiRoot),
  productProjections: jest.fn(() => apiRoot),
  categories: jest.fn(() => apiRoot),
  orders: jest.fn(() => apiRoot),
  search: jest.fn(() => apiRoot),
  withId: jest.fn(() => apiRoot),
  withContainer: jest.fn(() => apiRoot),
  get: jest.fn(() => apiRoot),
  execute: jest.fn(() => ({ body: { results: [] } })),
};
jest.mock('../src/client/create.client', () => {
  return {
    createApiRoot: () => apiRoot,
  };
});

describe('test coco api client', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('get avalara merchant data method', async () => {
    apiRoot.execute = jest.fn(() => avalaraMerchantDataBody(false));
    const data = await getData('avalara-connector-settings');
    expect(apiRoot.customObjects).toBeCalledTimes(1);
    expect(apiRoot.withContainer).toBeCalledWith({
      container: 'avalara-connector-settings',
    });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(data).toBeDefined();
    expect(Object.keys(data?.settings).length).toBe(12);
  });

  test('get avalara merchant data method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getData('avalara-connector-settings');
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data).toEqual({});
  });

  test('get shipping tax code method', async () => {
    apiRoot.execute = jest.fn(() => shipTaxCodeBody('PC030000'));
    const data = await getShipTaxCode('123');
    expect(apiRoot.shippingMethods).toBeCalledTimes(1);
    expect(apiRoot.withId).toBeCalledWith({ ID: '123' });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(data).toBe('PC030000');
  });

  test('get shipping tax code method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getShipTaxCode('123');
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data).toBe('');
  });

  test('get customer entity use code method', async () => {
    apiRoot.execute = jest.fn(() => entityUseCodeBody('B'));
    const data = await getCustomerEntityUseCode('123');
    expect(apiRoot.customers).toBeCalledTimes(1);
    expect(apiRoot.withId).toBeCalledWith({ ID: '123' });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data.customerNumber).toBe('123');
    expect(data.exemptCode).toBe('B');
  });

  test('get customer entity use code method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getCustomerEntityUseCode('123');
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data.customerNumber).toBe('123');
    expect(data.exemptCode).toBe('');
  });

  test('get all categories of a list of products', async () => {
    apiRoot.execute = jest.fn(() => bulkProductCategoriesBody);
    const data = await getBulkProductCategories(['sku123', 'sku456']);
    expect(apiRoot.productProjections).toBeCalledTimes(1);
    expect(apiRoot.search).toBeCalledTimes(1);
    expect(apiRoot.get).toBeCalledWith({
      queryArgs: { filter: `variants.sku:"sku123","sku456"`, limit: 500 },
    });
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data[0]?.sku).toBe('sku123');
    expect(data[0]?.categories[0]).toBe('123');
    expect(data[1]?.sku).toBe('sku456');
    expect(data[1]?.categories[0]).toBe('456');
  });

  test('get all categories of a list of products fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getBulkProductCategories(['sku123', 'sku456']);
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data).toEqual([]);
  });

  test('get all tax codes of a list of categories', async () => {
    apiRoot.execute = jest.fn(() =>
      bulkCategoryTaxCodeBody(['PS081282', 'PS080101'])
    );
    const data = await getBulkCategoryTaxCode(['123', '456']);
    expect(apiRoot.categories).toBeCalledTimes(1);
    expect(apiRoot.get).toBeCalledWith({
      queryArgs: { where: `id in ("123", "456")`, limit: 500 },
    });
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data[0]?.id).toBe('123');
    expect(data[0]?.avalaraTaxCode).toBe('PS081282');
    expect(data[1]?.id).toBe('456');
    expect(data[1]?.avalaraTaxCode).toBe('PS080101');
  });

  test('get all tax codes of a list of categories fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getBulkCategoryTaxCode(['123', '456']);
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data).toEqual([]);
  });

  test('get order', async () => {
    apiRoot.execute = jest.fn(() => orderRequest('123', 'US'));
    const data = await getOrder('123');
    expect(apiRoot.orders).toBeCalledTimes(1);
    expect(apiRoot.withId).toBeCalledWith({ ID: '123' });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data?.id).toBe('123');
    expect(data?.shippingAddress?.country).toBe('US');
  });

  test('get order fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getOrder('123');
    expect(apiRoot.execute).toBeCalledTimes(1);
    expect(apiRoot.execute).toThrowError();
    expect(data).toEqual({});
  });
});
