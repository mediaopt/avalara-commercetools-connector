import { Cart } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';

export function postProcessing(cart: Cart, taxResponse: TransactionModel) {
  const actions = [];

  const taxRate = taxResponse?.summary
    ?.map((x) => x.rate)
    .reduce((acc, curr) => (acc || 0) + (curr || 0), 0);

  let totalTax = 0;

  const lines: any = taxResponse?.lines;

  for (const i in cart?.lineItems) {
    const item = cart?.lineItems[i];

    const taxCentAmount = lines[i]?.tax * 100;
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
          amount: taxCentAmount? taxRate : 0,
          country: cart?.country,
        },
      },
    });
  }

  const shipTaxCentAmount = lines[lines.length - 1]?.tax * 100;

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
        amount: shipTaxCentAmount? taxRate : 0,
        country: cart?.country,
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

  return {
    actions: actions,
  };
}
