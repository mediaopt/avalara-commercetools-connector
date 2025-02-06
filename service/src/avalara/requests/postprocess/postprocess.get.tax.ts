import { Cart, UpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { hashCart } from '../../../utils/hash.utils';

export function postProcessing(
  cart: Cart,
  taxResponse: TransactionModel
): Array<UpdateAction> {
  const actions = [];

  if (cart?.taxMode !== 'ExternalAmount') {
    actions.push({ action: 'changeTaxMode', taxMode: 'ExternalAmount' });
  }

  const taxRate = taxResponse?.summary
    ?.map((x) => x.rate)
    .reduce((acc, curr) => (acc || 0) + (curr || 0), 0);

  let totalTax = 0;

  const lines: any = taxResponse?.lines;

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

  for (const item of cart?.customLineItems || []) {
    const taxCentAmount =
      lines.find((x: any) => x.itemCode === item?.key)?.tax * 100;

    totalTax += taxCentAmount;

    actions.push({
      action: 'setCustomLineItemTaxAmount',
      customLineItemId: item.id,
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

  let shipTaxCentAmount = 0;
  let shipPrice = 0;
  let shippingKey = '';

  if (cart?.shippingInfo) {
    shippingKey = cart?.shippingKey as string;
    shipTaxCentAmount =
      lines.find((x: any) => x.itemCode === 'Shipping')?.tax * 100;
    shipPrice =
      cart?.shippingInfo?.discountedPrice?.value?.centAmount ??
      (cart?.shippingInfo?.price?.centAmount as number);
    totalTax += shipTaxCentAmount;
  } else if (cart?.shipping) {
    const shipping = cart?.shipping[0];
    shippingKey = shipping?.shippingKey;
    shipTaxCentAmount =
      lines.find((x: any) => x.itemCode === shippingKey)?.tax * 100;
    shipPrice =
      shipping?.shippingInfo?.discountedPrice?.value?.centAmount ??
      (shipping?.shippingInfo?.price?.centAmount as number);
    totalTax += shipTaxCentAmount;
  }

  actions.push({
    action: 'setShippingMethodTaxAmount',
    shippingKey: shippingKey,
    externalTaxAmount: {
      totalGross: {
        centAmount: shipPrice + shipTaxCentAmount,
        currencyCode: cart?.totalPrice?.currencyCode,
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: shipTaxCentAmount ? taxRate : 0,
        country:
          cart?.country ||
          cart?.shippingAddress?.country ||
          cart?.shipping[0]?.shippingAddress?.country,
      },
    },
  });

  actions.push({
    action: 'setCartTotalTax',
    externalTotalGross: {
      currencyCode: cart?.totalPrice?.currencyCode,
      centAmount: cart?.totalPrice?.centAmount + totalTax, // minus total cart discount gross
    },
  });

  if (!cart?.custom?.type) {
    actions.push({
      action: 'setCustomType',
      type: {
        key: process.env.ORDER_CUSTOM_TYPE_KEY as string,
        typeId: 'type',
      },
      fields: {
        avalaraHash: hashCart(cart),
      },
    });
  } else {
    actions.push({
      action: 'setCustomField',
      name: 'avalaraHash',
      value: hashCart(cart),
    });
  }

  return actions;
}
