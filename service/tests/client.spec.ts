import { describe, expect, test, jest, afterEach } from '@jest/globals';
import {
  getData,
  getShipTaxCode,
  getCustomerEntityUseCode,
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../src/client/data.client';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  shipTaxCodeBody,
} from './test.data';

const apiRoot: any = {
  customObjects: jest.fn(() => apiRoot),
  shippingMethods: jest.fn(() => apiRoot),
  customers: jest.fn(() => apiRoot),
  productProjections: jest.fn(() => apiRoot),
  categories: jest.fn(() => apiRoot),
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
  test('get avalara merchant data method succeeds', async () => {
    apiRoot.execute = jest.fn(() => avalaraMerchantDataBody);
    const data = await getData('avalara-connector-settings');
    expect(apiRoot.customObjects).toHaveBeenCalledTimes(1);
    expect(apiRoot.withContainer).toHaveBeenCalledWith({
      container: 'avalara-connector-settings',
    });
    expect(apiRoot.get).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);

    expect(data).toBeDefined();
    expect(Object.keys(data?.settings).length).toBe(12);
  });

  test('get avalara merchant data method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getData('avalara-connector-settings');
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toThrow();
    expect(data).toBeUndefined();
  });

  test('get shipping tax code method succeeds', async () => {
    apiRoot.execute = jest.fn(() => shipTaxCodeBody);
    const data = await getShipTaxCode('123');
    expect(apiRoot.shippingMethods).toHaveBeenCalledTimes(1);
    expect(apiRoot.withId).toHaveBeenCalledWith({ ID: '123' });
    expect(apiRoot.get).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);

    expect(data).toBe('PC030000');
  });

  test('get shipping tax code method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getShipTaxCode('123');
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toThrow();

    expect(data).toBeUndefined();
  });

  test('get customer entity use code method succeeds', async () => {
    apiRoot.execute = jest.fn(() => entityUseCodeBody);
    const data = await getCustomerEntityUseCode('123');
    expect(apiRoot.customers).toHaveBeenCalledTimes(1);
    expect(apiRoot.withId).toHaveBeenCalledWith({ ID: '123' });
    expect(apiRoot.get).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);

    expect(data).toBe('B');
  });

  test('get customer entity use code method fails', async () => {
    apiRoot.execute = jest.fn(() => {
      throw new Error('error');
    });
    const data = await getCustomerEntityUseCode('123');
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toThrow();

    expect(data).toBeUndefined();
  });

  test('get all categories of a list of products succeeds', async () => {
    apiRoot.execute = jest.fn(() => bulkProductCategoriesBody);
    const data = await getBulkProductCategories(['sku123', 'sku456']);
    expect(apiRoot.productProjections).toHaveBeenCalledTimes(1);
    expect(apiRoot.search).toHaveBeenCalledTimes(1);
    expect(apiRoot.get).toHaveBeenCalledWith({
      queryArgs: { filter: `variants.sku:"sku123","sku456"`, limit: 500 },
    });
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);

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
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toThrow();

    expect(data).toEqual([]);
  });

  test('get all tax codes of a list of categories succeeds', async () => {
    apiRoot.execute = jest.fn(() => bulkCategoryTaxCodeBody);
    const data = await getBulkCategoryTaxCode(['123', '456']);
    expect(apiRoot.categories).toHaveBeenCalledTimes(1);
    expect(apiRoot.get).toHaveBeenCalledWith({
      queryArgs: { where: `id in ("123", "456")`, limit: 500 },
    });
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);

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
    expect(apiRoot.execute).toHaveBeenCalledTimes(1);
    expect(apiRoot.execute).toThrow();

    expect(data).toEqual([]);
  });
});
