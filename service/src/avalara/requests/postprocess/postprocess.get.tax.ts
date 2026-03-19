import { Cart, UpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { hashCart } from '../../../utils/hash.utils';
import { TransactionLineDetailModel } from 'avatax/lib/models/TransactionLineDetailModel';

export function postProcessing(
  cart: Cart,
  taxResponse: TransactionModel
): Array<UpdateAction> {
  const actions = [];

  if (cart?.taxMode !== 'ExternalAmount') {
    actions.push({ action: 'changeTaxMode', taxMode: 'ExternalAmount' });
  }

  const rate = (
    rateSummaryElements: TransactionLineDetailModel[] | undefined
  ) => {
    let rate = 0;

    rateSummaryElements?.forEach((element) => {
      const taxable = element.taxableAmount as number;
      const nonTaxable = element.nonTaxableAmount as number;
      const taxCalculated = element.taxCalculated as number;

      // No taxable amount => tax rate is 0
      if (taxable == 0) {
        return;
      }

      // No non-taxable amount => tax rate is full rate
      if (nonTaxable == 0) {
        rate += element.rate as number;
        return;
      }

      // Mixed taxable and non-taxable amounts => calculate effective tax rate
      const totalAmount = taxable + nonTaxable;
      rate += Math.round((10000 * taxCalculated) / totalAmount) / 10000;
      return;
    });
    return rate;
  };

  let totalTax = 0;

  const lines = taxResponse?.lines;

  for (const item of cart?.lineItems || []) {
    const avalaraLineItem = lines?.find(
      (x) => x.itemCode === item?.variant?.sku
    );

    const taxCentAmount = (avalaraLineItem?.tax as number) * 100;

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
          amount: taxCentAmount ? rate(avalaraLineItem?.details) : 0,
          country: cart?.country || cart?.shippingAddress?.country,
        },
      },
    });
  }

  for (const item of cart?.customLineItems || []) {
    const avalaraLineItem = lines?.find((x) => x.itemCode === item?.key);
    const taxCentAmount = (avalaraLineItem?.tax as number) * 100;

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
          amount: taxCentAmount ? rate(avalaraLineItem?.details) : 0,
          country: cart?.country || cart?.shippingAddress?.country,
        },
      },
    });
  }

  const avalaraShippingLine = lines?.find((x) => x.itemCode === 'Shipping');
  const shipTaxCentAmount = (avalaraShippingLine?.tax as number) * 100;

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
        amount: shipTaxCentAmount ? rate(avalaraShippingLine?.details) : 0,
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
