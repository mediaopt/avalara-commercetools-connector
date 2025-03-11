import { CustomLineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { convertCustomLineItemModel } from '../../src/avalara/model/line-item-model/custom.line.item.model';
import { describe, expect, it } from '@jest/globals';

describe('convertCustomLineItemModel', () => {
  it('should convert CT CustomLineItem Model to Avalara LineItem Model', () => {
    const item: CustomLineItem = {
      quantity: 2,
      totalPrice: { centAmount: 2000 },
      key: 'custom-key',
      id: 'custom-id',
      name: { en: 'Custom Product' },
      taxRate: { includedInPrice: true },
      custom: {
        fields: {
          avalaraTaxCode: 'custom-tax-code',
        },
      },
    } as any;

    const result = convertCustomLineItemModel(item);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(2);
    expect(result.amount).toBe(20);
    expect(result.itemCode).toBe('custom-key');
    expect(result.description).toBe('Custom Product');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('custom-tax-code');
  });

  it('should use item id if key is not provided', () => {
    const item: CustomLineItem = {
      quantity: 2,
      totalPrice: { centAmount: 2000 },
      id: 'custom-id',
      name: { en: 'Custom Product' },
      taxRate: { includedInPrice: true },
      custom: {
        fields: {
          avalaraTaxCode: 'custom-tax-code',
        },
      },
    } as any;

    const result = convertCustomLineItemModel(item);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBe(2);
    expect(result.amount).toBe(20);
    expect(result.itemCode).toBe('custom-id');
    expect(result.description).toBe('Custom Product');
    expect(result.taxIncluded).toBe(true);
    expect(result.taxCode).toBe('custom-tax-code');
  });

  it('should handle missing fields in CustomLineItem', () => {
    const item: CustomLineItem = {} as any;

    const result = convertCustomLineItemModel(item);

    expect(result).toBeInstanceOf(LineItemModel);
    expect(result.quantity).toBeUndefined();
    expect(result.amount).toBeNaN();
    expect(result.itemCode).toBeUndefined();
    expect(result.description).toBeUndefined();
    expect(result.taxIncluded).toBeUndefined();
    expect(result.taxCode).toBeUndefined();
  });
});
