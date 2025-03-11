import { CustomFields, ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { extractShippingMethodTaxCode } from '../../src/avalara/helpers/tax.code.helpers';
import { convertShippingInfoModel } from '../../src/avalara/model/line-item-model/shipping.info.model';
import { describe, expect, it, jest, afterEach } from '@jest/globals';

jest.mock('../../src/avalara/helpers/tax.code.helpers');

const mockExtractShippingMethodTaxCode =
  extractShippingMethodTaxCode as jest.MockedFunction<
    typeof extractShippingMethodTaxCode
  >;

describe('convertShippingInfoModel', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should convert CT ShippingInfo Model to Avalara LineItem Model', async () => {
    const item: ShippingInfo = {
      price: { centAmount: 1000 },
      shippingMethodName: 'Standard Shipping',
      taxRate: { includedInPrice: true },
      shippingMethod: { id: 'shipping-method-id' },
    } as any;

    const shippingCustomFields: CustomFields = {
      fields: {
        avalaraTaxCode: 'shipping-tax-code',
      },
    } as any;

    mockExtractShippingMethodTaxCode.mockResolvedValue('shipping-tax-code');

    const result = await convertShippingInfoModel(item, shippingCustomFields);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(1);
    expect(result.amount).toBe(10);
    expect(result.description).toBe('Standard Shipping');
    expect(result.itemCode).toBe('Shipping');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('shipping-tax-code');
  });

  it('should use default tax code if extractShippingMethodTaxCode returns undefined', async () => {
    const item: ShippingInfo = {
      price: { centAmount: 1000 },
      shippingMethodName: 'Standard Shipping',
      taxRate: { includedInPrice: true },
      shippingMethod: { id: 'shipping-method-id' },
    } as any;

    const shippingCustomFields: CustomFields = {
      fields: {
        avalaraTaxCode: 'shipping-tax-code',
      },
    } as any;

    mockExtractShippingMethodTaxCode.mockResolvedValue(undefined);

    const result = await convertShippingInfoModel(item, shippingCustomFields);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(1);
    expect(result.amount).toBe(10);
    expect(result.description).toBe('Standard Shipping');
    expect(result.itemCode).toBe('Shipping');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('FR010000');
  });

  it('should handle missing fields in ShippingInfo', async () => {
    const item: ShippingInfo = {} as any;

    const shippingCustomFields: CustomFields = {} as any;

    const result = await convertShippingInfoModel(item, shippingCustomFields);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(1);
    expect(result.amount).toBeNaN();
    expect(result.description).toBeUndefined();
    expect(result.itemCode).toBe('Shipping');
    expect(result.taxIncluded).toBeUndefined();
    expect(result.taxCode).toBe('FR010000');
  });
});
