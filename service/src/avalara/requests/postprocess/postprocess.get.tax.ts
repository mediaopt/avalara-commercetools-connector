import { Cart, LineItem, UpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { hashCart } from '../../../utils/hash.utils';

function getLineItemTaxAmountAction(
  cart: Cart,
  item: LineItem,
  taxCentAmount: number,
  taxRate: number,
  pricesIncludesTax: boolean
) {
  return {
    action: 'setLineItemTaxAmount',
    lineItemId: item.id,
    externalTaxAmount: {
      totalGross: {
        currencyCode: cart?.totalPrice?.currencyCode,
        centAmount:
          item?.totalPrice?.centAmount +
          (pricesIncludesTax ? 0 : taxCentAmount),
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: taxCentAmount ? taxRate : 0,
        country: cart?.country || cart?.shippingAddress?.country,
        includedInPrice: pricesIncludesTax,
      },
    },
  };
}

function getTaxRate(taxResponse: TransactionModel) {
  const taxRate =
    taxResponse?.summary
      ?.map((x) => x.rate)
      .reduce((acc, curr) => (acc || 0) + (curr || 0), 0) ?? 0;

  return taxRate;
}

function extractTaxCentAmount(lines: any, itemCode?: string) {
  return lines.find((x: any) => x.itemCode === itemCode)?.tax * 100;
}

export function postProcessing(
  cart: Cart,
  taxResponse: TransactionModel,
  pricesIncludesTax: boolean
): Array<UpdateAction> {
  const actions = [];

  actions.push({
    action: 'changeTaxMode',
    taxMode: 'ExternalAmount',
  });

  const taxRate = getTaxRate(taxResponse);

  const lines: any = taxResponse?.lines;
  const shipTaxCentAmount = extractTaxCentAmount(lines, 'Shipping');
  let totalTax = shipTaxCentAmount;

  for (const item of cart?.lineItems || []) {
    const taxCentAmount = extractTaxCentAmount(lines, item?.variant?.sku);

    totalTax += taxCentAmount;

    actions.push(
      getLineItemTaxAmountAction(
        cart,
        item,
        taxCentAmount,
        taxRate,
        pricesIncludesTax
      )
    );
  }

  const shipPrice = cart?.shippingInfo?.price?.centAmount || 0;

  actions.push({
    action: 'setShippingMethodTaxAmount',
    shippingKey: cart?.shippingKey,
    externalTaxAmount: {
      totalGross: {
        centAmount: shipPrice + (pricesIncludesTax ? 0 : shipTaxCentAmount),
        currencyCode: cart?.totalPrice?.currencyCode,
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: shipTaxCentAmount ? taxRate : 0,
        country: cart?.country || cart?.shippingAddress?.country,
        includedInPrice: pricesIncludesTax,
      },
    },
  });

  actions.push({
    action: 'setCartTotalTax',
    externalTotalGross: {
      currencyCode: cart?.totalPrice?.currencyCode,
      centAmount:
        cart?.totalPrice?.centAmount +
        (pricesIncludesTax ? shipPrice : totalTax),
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
