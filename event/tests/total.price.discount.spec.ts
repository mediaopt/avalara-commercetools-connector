import { describe, expect, it } from '@jest/globals';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { applyTotalPriceDiscount } from '../src/utils/total.price.discount.utils';

const document = () =>
  ({
    lines: [
      { itemCode: 'SKU-1', quantity: 2, amount: 622.67 },
      { itemCode: 'SKU-2', quantity: 1, amount: 134.83 },
      { itemCode: 'Shipping', quantity: 1, amount: 0 },
    ],
  }) as CreateTransactionModel;

const discount = (centAmount: number) =>
  ({
    discountedAmount: {
      type: 'centPrecision',
      currencyCode: 'USD',
      centAmount,
      fractionDigits: 2,
    },
    includedDiscounts: [],
  }) as any;

describe('applyTotalPriceDiscount', () => {
  it('sends a totalPrice discount as document discount over every line', () => {
    // A $15 code discount on the total: commercetools leaves the line totals
    // as they are, so without the document discount Avalara taxes 757.50
    // instead of the 742.50 the shopper pays.
    const result = applyTotalPriceDiscount(document(), discount(1500));

    expect(result.discount).toBe(15);
    expect(result.lines.map((line) => line.discounted)).toEqual([
      true,
      true,
      true,
    ]);
    expect(result.lines.map((line) => line.amount)).toEqual([
      622.67, 134.83, 0,
    ]);
  });

  it('leaves the document untouched without a totalPrice discount', () => {
    const result = applyTotalPriceDiscount(document(), undefined);

    expect(result.discount).toBeUndefined();
    expect(result.lines.some((line) => line.discounted)).toBe(false);
  });

  it('ignores a zero discounted amount', () => {
    const result = applyTotalPriceDiscount(document(), discount(0));

    expect(result.discount).toBeUndefined();
    expect(result.lines.some((line) => line.discounted)).toBe(false);
  });

  it('does nothing on a document without lines', () => {
    const result = applyTotalPriceDiscount(
      {} as CreateTransactionModel,
      discount(1500)
    );

    expect(result.discount).toBeUndefined();
  });
});
