import { describe, expect, test, jest, afterEach } from '@jest/globals';
import {
  getData,
  getShipTaxCode,
  getCustomerEntityUseCode,
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../src/client/create.client';
import * as moduleApiRoot from '../src/client/create.client';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  shipTaxCodeBody,
} from './test.data';

describe('test coco api client', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });
  test('get avalara merchant data method', async () => {
    const apiRoot: any = {
      customObjects: jest.fn(() => apiRoot),
      withContainer: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRoot),
      execute: jest.fn(() => avalaraMerchantDataBody),
    };
    jest
      .spyOn(moduleApiRoot, 'createApiRoot')
      .mockImplementationOnce(() => apiRoot);
    const data = await getData('avalara-commercetools-connector');
    expect(apiRoot.customObjects).toBeCalledTimes(1);
    expect(apiRoot.withContainer).toBeCalledWith({
      container: 'avalara-commercetools-connector',
    });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data?.settings).toHaveProperty('accountNumber');
    expect(data?.settings.accountNumber).toBe(process.env.AVALARA_USERNAME);
  });

  test('get shipping tax code method', async () => {
    const apiRoot: any = {
      shippingMethods: jest.fn(() => apiRoot),
      withId: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRoot),
      execute: jest.fn(() => shipTaxCodeBody),
    };
    jest
      .spyOn(moduleApiRoot, 'createApiRoot')
      .mockImplementationOnce(() => apiRoot);
    const data = await getShipTaxCode('123');
    expect(apiRoot.shippingMethods).toBeCalledTimes(1);
    expect(apiRoot.withId).toBeCalledWith({ ID: '123' });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBe('PC030000');
  });

  test('get customer entity use code method', async () => {
    const apiRoot: any = {
      customers: jest.fn(() => apiRoot),
      withId: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRoot),
      execute: jest.fn(() => entityUseCodeBody),
    };
    jest
      .spyOn(moduleApiRoot, 'createApiRoot')
      .mockImplementationOnce(() => apiRoot);
    const data = await getCustomerEntityUseCode('123');
    expect(apiRoot.customers).toBeCalledTimes(1);
    expect(apiRoot.withId).toBeCalledWith({ ID: '123' });
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBe('B');
  });

  test('get all categories of a list of products', async () => {
    const apiRoot: any = {
      productProjections: jest.fn(() => apiRoot),
      search: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRoot),
      execute: jest.fn(() => bulkProductCategoriesBody),
    };
    jest
      .spyOn(moduleApiRoot, 'createApiRoot')
      .mockImplementationOnce(() => apiRoot);
    const data = await getBulkProductCategories(['sku123', 'sku456']);
    expect(apiRoot.productProjections).toBeCalledTimes(1);
    expect(apiRoot.search).toBeCalledTimes(1);
    expect(apiRoot.get).toBeCalledWith({
      queryArgs: { filter: `variants.sku:"sku123","sku456"` },
    });
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data[0]?.sku).toBe('sku123');
    expect(data[0]?.categories[0]).toBe('123');
    expect(data[1]?.sku).toBe('sku456');
    expect(data[1]?.categories[0]).toBe('456');
  });

  test('get all tax codes of a list of categories', async () => {
    const apiRoot: any = {
      categories: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRoot),
      execute: jest.fn(() => bulkCategoryTaxCodeBody),
    };
    jest
      .spyOn(moduleApiRoot, 'createApiRoot')
      .mockImplementationOnce(() => apiRoot);
    const data = await getBulkCategoryTaxCode(['123', '456']);
    expect(apiRoot.categories).toBeCalledTimes(1);
    expect(apiRoot.get).toBeCalledWith({
      queryArgs: { where: `id in ("123", "456")` },
    });
    expect(apiRoot.execute).toBeCalledTimes(1);

    expect(data).toBeDefined();
    expect(data[0]?.id).toBe('123');
    expect(data[0]?.avalaraTaxCode).toBe('PS081282');
    expect(data[1]?.id).toBe('456');
    expect(data[1]?.avalaraTaxCode).toBe('PS080101');
  });
});
