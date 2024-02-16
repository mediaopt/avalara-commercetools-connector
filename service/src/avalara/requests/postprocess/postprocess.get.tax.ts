import { Cart, UpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { hashCart } from '../../../utils/hash.utils';
import { getDiscountInfo } from '../../../client/data.client';

export async function postProcessing(
  cart: Cart,
  taxResponse: TransactionModel
): Promise<Array<UpdateAction>> {
  const actions = [];

  actions.push({
    action: 'changeTaxMode',
    taxMode: 'ExternalAmount',
  });

  const taxRate = taxResponse?.summary
    ?.map((x) => x.rate)
    .reduce((acc, curr) => (acc || 0) + (curr || 0), 0);

  let totalTax = 0;

  const lines: any = taxResponse?.lines;

  const discountsInfo = await getDiscountInfo(
    cart?.discountOnTotalPrice?.includedDiscounts?.map(
      (x) => x.discount.id
    ) as string[]
  );

  for (const discount of discountsInfo) {
    const taxCentAmount =
      lines.find(
        (x: any) => x.itemCode === 'Discount' && x.description === discount.name
      )?.tax * 100;

    totalTax += taxCentAmount;
  }

  for (const item of cart?.lineItems || []) {
    const taxCentAmount =
      lines.find((x: any) => x.itemCode === item?.variant?.sku)?.tax * 100;

    totalTax += taxCentAmount;

    actions.push({
      action: 'setLineItemTaxAmount',
      lineItemId: item.id,
      externalTaxAmount: {
        totalGross: {
          currencyCode: cart?.totalPrice?.currencyCode,
          centAmount: item?.totalPrice?.centAmount + taxCentAmount,
        },
        taxRate: {
          name: 'avaTaxRate',
          amount: taxCentAmount ? taxRate : 0,
          country: cart?.country || cart?.shippingAddress?.country,
        },
      },
    });
  }

  const shipTaxCentAmount =
    lines.find((x: any) => x.itemCode === 'Shipping')?.tax * 100;

  const shipPrice = cart?.shippingInfo?.price?.centAmount || 0;
  totalTax += shipTaxCentAmount;

  actions.push({
    action: 'setShippingMethodTaxAmount',
    shippingKey: cart?.shippingKey,
    externalTaxAmount: {
      totalGross: {
        centAmount: shipPrice + shipTaxCentAmount,
        currencyCode: cart?.totalPrice?.currencyCode,
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: shipTaxCentAmount ? taxRate : 0,
        country: cart?.country || cart?.shippingAddress?.country,
      },
    },
  });

  actions.push({
    action: 'setCartTotalTax',
    externalTotalGross: {
      currencyCode: cart?.totalPrice?.currencyCode,
      centAmount: cart?.totalPrice?.centAmount + totalTax,
    },
  });

  actions.push({
    action: 'setCustomType',
    type: {
      key: 'avalara-hashed-cart',
      typeId: 'type',
    },
    fields: {
      avahash: hashCart(cart),
    },
  });

  return actions;
}
