import { describe, expect, test } from '@jest/globals';
import {
  getData,
  getShipTaxCode,
  getCustomerEntityUseCode,
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../src/client/create.client';

describe('Data can be loaded', () => {
  test('Data exists and is defined', async () => {
    const data = await getData('avalara-commercetools-connector');
    expect(data).toBeDefined();
    expect(data).toHaveProperty('settings');
  });
});

describe('Ship Tax Code can be loaded', () => {
  test('Data exists and is defined', async () => {
    const data = await getShipTaxCode('34ca7a03-4eb4-4f05-9b2b-2e935b641f63');
    expect(typeof data).toBe('string');
  });
});

describe('Entity use code can be loaded', () => {
  test('Data exists and is defined', async () => {
    const data = await getCustomerEntityUseCode(
      '57340918-98ce-493e-8dbd-eea993a1ab26'
    );
    expect(typeof data).toBe('string');
  });
});

describe('Categories can be bulk loaded', () => {
  test('Data exists and is defined', async () => {
    const data = await getBulkProductCategories(['72367', '85778']);
    expect(data).toBeDefined();
    expect(data[0]).toHaveProperty('productKey');
    expect(data[0]).toHaveProperty('categories');
    expect(data[0]?.productKey).toBeDefined();
  });
});

describe('Categories tax codes can be bulk loaded', () => {
  test('Data exists and is defined', async () => {
    const data = await getBulkCategoryTaxCode([
      '724782b3-d2c1-40ed-b757-c5c3671aeefb',
      '23139051-4054-4a56-bb13-f0614b0aaec9',
    ]);
    expect(data).toBeDefined();
    expect(data[0]).toHaveProperty('id');
    expect(data[0]).toHaveProperty('avalaraTaxCode');
    expect(data[0]?.id).toBeDefined();
  });
});
