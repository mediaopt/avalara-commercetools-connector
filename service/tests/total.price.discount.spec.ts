import { describe, expect, it } from '@jest/globals';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { applyTotalPriceDiscount } from '../src/utils/total.price.discount.utils';
import { hashCart } from '../src/utils/hash.utils';

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

describe('hashCart includes the totalPrice discount', () => {
  const cart = (discountOnTotalPrice?: unknown) =>
    ({
      lineItems: [],
      customLineItems: [],
      shippingInfo: {
        shippingMethod: { id: 'sm-1' },
        price: { centAmount: 1000 },
      },
      ...(discountOnTotalPrice ? { discountOnTotalPrice } : {}),
    }) as any;

  it('changes the digest when a discount code is added', () => {
    // Regression: adding a totalPrice discount code leaves every line total
    // unchanged. Without it in the digest the extension short-circuits and the
    // tax is never recalculated for the discounted total.
    expect(hashCart(cart())).not.toBe(hashCart(cart(discount(1500))));
  });

  it('changes the digest when the discounted amount changes', () => {
    expect(hashCart(cart(discount(1500)))).not.toBe(
      hashCart(cart(discount(2000)))
    );
  });
});

describe('hashCart includes the shipping discount', () => {
  const cart = (discountedCentAmount?: number) =>
    ({
      lineItems: [],
      customLineItems: [],
      shippingInfo: {
        shippingMethod: { id: 'sm-1' },
        price: { centAmount: 1000 },
        ...(discountedCentAmount !== undefined
          ? { discountedPrice: { value: { centAmount: discountedCentAmount } } }
          : {}),
      },
    }) as any;

  it('changes the digest when a shipping discount is added', () => {
    // Regression: shipping is sent to Avalara at its discounted price, but the
    // digest only covered the undiscounted one, so a shipping discount alone
    // never triggered a recalculation.
    expect(hashCart(cart())).not.toBe(hashCart(cart(0)));
  });

  it('changes the digest when the shipping discount changes', () => {
    expect(hashCart(cart(500))).not.toBe(hashCart(cart(0)));
  });
});
