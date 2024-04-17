import { TransactionLineModel } from 'avatax/lib/models/TransactionLineModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { expect } from '@jest/globals';

export const expectAvaTaxReturn = (taxResponse: TransactionModel) => {
  expect(taxResponse.code).toEqual('0');
  expect(taxResponse.date).toEqual(new Date().toISOString().substring(0, 10));
  expect(taxResponse.status).toEqual('Temporary');
  expect(taxResponse.type).toEqual('SalesOrder');
  expect(taxResponse.currencyCode).toEqual('USD');
  expect(taxResponse.entityUseCode).toEqual('B');
  expect(taxResponse.customerCode).toEqual('0');
  expect(taxResponse.totalAmount).toEqual(665);
  expect(taxResponse.totalTax).toEqual(48.22);
  expect(taxResponse.lines).toHaveLength(2);
  const item: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'sku123') ??
    ({} as TransactionLineModel);
  const shipping: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'Shipping') ??
    ({} as TransactionLineModel);
  expect(item.itemCode).toEqual('sku123');
  expect(item.quantity).toEqual(2);
  expect(item.lineAmount).toEqual(655);
  expect(item.taxCode).toEqual('PS081282');
  expect(item.tax).toEqual(47.49);
  expect(item.taxIncluded).toEqual(false);
  expect(shipping.itemCode).toEqual('Shipping');
  expect(shipping.quantity).toEqual(1);
  expect(shipping.lineAmount).toEqual(10);
  expect(shipping.taxCode).toEqual('PC030000');
  expect(shipping.tax).toEqual(0.73);
  expect(shipping.taxIncluded).toEqual(false);
  expect(taxResponse.addresses).toHaveLength(2);
  expect(
    taxResponse.addresses?.find((address) => address.line1 === '505 Beasley St')
  ).toBeDefined();
  expect(
    taxResponse.addresses?.find((address) => address.line1 === '2000 Main St')
  ).toBeDefined();
};

export const expectAvaTaxReturnWithTaxIncludedPrices = (
  taxResponse: TransactionModel
) => {
  expect(taxResponse.code).toEqual('0');
  expect(taxResponse.date).toEqual(new Date().toISOString().substring(0, 10));
  expect(taxResponse.status).toEqual('Temporary');
  expect(taxResponse.type).toEqual('SalesOrder');
  expect(taxResponse.currencyCode).toEqual('USD');
  expect(taxResponse.entityUseCode).toEqual('B');
  expect(taxResponse.customerCode).toEqual('0');
  expect(taxResponse.totalAmount).toEqual(620.05);
  expect(taxResponse.totalTax).toEqual(44.95);
  expect(taxResponse.lines).toHaveLength(2);
  const item: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'sku123') ??
    ({} as TransactionLineModel);
  const shipping: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'Shipping') ??
    ({} as TransactionLineModel);
  expect(item.itemCode).toEqual('sku123');
  expect(item.quantity).toEqual(2);
  expect(item.lineAmount).toEqual(610.72);
  expect(item.taxCode).toEqual('PS081282');
  expect(item.tax).toEqual(44.28);
  expect(item.taxIncluded).toEqual(true);
  expect(shipping.itemCode).toEqual('Shipping');
  expect(shipping.quantity).toEqual(1);
  expect(shipping.lineAmount).toEqual(9.33);
  expect(shipping.taxCode).toEqual('PC030000');
  expect(shipping.tax).toEqual(0.67);
  expect(shipping.taxIncluded).toEqual(true);
  expect(taxResponse.addresses).toHaveLength(2);
  expect(
    taxResponse.addresses?.find((address) => address.line1 === '505 Beasley St')
  ).toBeDefined();
  expect(
    taxResponse.addresses?.find((address) => address.line1 === '2000 Main St')
  ).toBeDefined();
};

export const actions = {
  actions: [
    { action: 'changeTaxMode', taxMode: 'ExternalAmount' },
    {
      action: 'setLineItemTaxAmount',
      lineItemId: 'id123',
      externalTaxAmount: {
        totalGross: { currencyCode: 'USD', centAmount: 70249 },
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          country: 'US',
          includedInPrice: false,
        },
      },
    },
    {
      action: 'setShippingMethodTaxAmount',
      externalTaxAmount: {
        totalGross: { centAmount: 1073, currencyCode: 'USD' },
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          country: 'US',
          includedInPrice: false,
        },
      },
    },
    {
      action: 'setCartTotalTax',
      externalTotalGross: { currencyCode: 'USD', centAmount: 71322 },
    },
    {
      action: 'setCustomField',
      name: 'avalaraHash',
      value: '447bf31f9fc955c798d259ffb2b4d47a',
    },
  ],
};

export const actionsWithTaxIncludedPrices = {
  actions: [
    { action: 'changeTaxMode', taxMode: 'ExternalAmount' },
    {
      action: 'setLineItemTaxAmount',
      lineItemId: 'id123',
      externalTaxAmount: {
        totalGross: { currencyCode: 'USD', centAmount: 65500 },
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          country: 'US',
          includedInPrice: true,
        },
      },
    },
    {
      action: 'setShippingMethodTaxAmount',
      externalTaxAmount: {
        totalGross: { centAmount: 1000, currencyCode: 'USD' },
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          country: 'US',
          includedInPrice: true,
        },
      },
      shippingKey: undefined,
    },
    {
      action: 'setCartTotalTax',
      externalTotalGross: { currencyCode: 'USD', centAmount: 66500 },
    },
    {
      action: 'setCustomType',
      type: { key: 'avalara-hashed-cart', typeId: 'type' },
      fields: { avahash: '1b66a466d56d06cc3b756366ac86868a' },
    },
  ],
};
