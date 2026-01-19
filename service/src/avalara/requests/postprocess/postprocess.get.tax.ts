import { Cart, UpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { hashCart } from '../../../utils/hash.utils';
import { TransactionSummary } from 'avatax/lib/models/TransactionSummary';

export function postProcessing(
  cart: Cart,
  taxResponse: TransactionModel
): Array<UpdateAction> {
  const actions = [];

  if (cart?.taxMode !== 'ExternalAmount') {
    actions.push({ action: 'changeTaxMode', taxMode: 'ExternalAmount' });
  }

  const rate = (rateSummaryElement: TransactionSummary) => {
    const taxable = rateSummaryElement.taxable as number;
    const nonTaxable = rateSummaryElement.nonTaxable as number;
    const taxCalculated = rateSummaryElement.taxCalculated as number;

    // No taxable amount => tax rate is 0
    if (taxable == 0) {
      return 0;
    }

    // No non-taxable amount => tax rate is full rate
    if (nonTaxable == 0) {
      return rateSummaryElement.rate as number;
    }

    // Mixed taxable and non-taxable amounts => calculate effective tax rate
    const totalAmount = taxable + nonTaxable;
    return Math.round((10000 * taxCalculated) / totalAmount) / 10000;
  };

  const taxRate = taxResponse.summary
    ?.map((x) => rate(x))
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

  const shipTaxCentAmount =
    lines.find((x: any) => x.itemCode === 'Shipping')?.tax * 100;

  const shipPrice =
    cart?.shippingInfo?.discountedPrice?.value?.centAmount ??
    (cart?.shippingInfo?.price?.centAmount as number);
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
