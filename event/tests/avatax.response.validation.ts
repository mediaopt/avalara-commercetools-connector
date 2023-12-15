import { expect } from '@jest/globals';
import { TransactionLineModel } from 'avatax/lib/models/TransactionLineModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';

const expectGeneralAvaTaxReturn = (
  taxResponse: TransactionModel,
  refund: boolean
) => {
  const coef = refund ? -1 : 1;
  expect(taxResponse.currencyCode).toEqual('USD');
  expect(taxResponse.entityUseCode).toEqual('B');
  expect(taxResponse.customerCode).toEqual('123');
  expect(taxResponse.totalAmount).toEqual(coef * 124.23);
  expect(taxResponse.totalTax).toEqual(coef * 9);
  expect(taxResponse.lines).toHaveLength(2);
  const item: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'sku123') ??
    ({} as TransactionLineModel);
  const shipping: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'Shipping') ??
    ({} as TransactionLineModel);
  expect(item.description).toEqual('Test Product');
  expect(item.itemCode).toEqual('sku123');
  expect(item.quantity).toEqual(2);
  expect(item.lineAmount).toEqual(coef * 123);
  expect(item.taxCode).toEqual('PS081282');
  expect(item.tax).toEqual(coef * 8.92);
  expect(item.taxIncluded).toEqual(false);
  expect(shipping.description).toEqual('Standard');
  expect(shipping.itemCode).toEqual('Shipping');
  expect(shipping.quantity).toEqual(1);
  expect(shipping.lineAmount).toEqual(coef * 1.23);
  expect(shipping.taxCode).toEqual('PC030000');
  expect(shipping.tax).toEqual(coef * 0.08);
  expect(shipping.taxIncluded).toEqual(false);
  const shipFrom = taxResponse.addresses?.find(
    (address) =>
      address.id ===
      taxResponse.locationTypes?.find((t) => t.locationTypeCode === 'ShipFrom')
        ?.documentAddressId
  );
  expect(shipFrom?.line1).toEqual('505 Beasley St');
  expect(shipFrom?.city).toEqual('Jackson');
  expect(shipFrom?.region).toEqual('MS');
  expect(shipFrom?.country).toEqual('US');
  expect(shipFrom?.postalCode).toEqual('39201-5802');
  const shipTo = taxResponse.addresses?.find(
    (address) =>
      address.id ===
      taxResponse.locationTypes?.find((t) => t.locationTypeCode === 'ShipTo')
        ?.documentAddressId
  );
  expect(shipTo?.line1).toEqual('2000 Main St');
  expect(shipTo?.city).toEqual('Irvine');
  expect(shipTo?.region).toEqual('CA');
  expect(shipTo?.country).toEqual('US');
  expect(shipTo?.postalCode).toEqual('92614-7211');
};

export const expectCommitReturn = (
  orderNumber: string,
  taxResponse: TransactionModel
) => {
  expect(taxResponse.code).toEqual(orderNumber);
  expect(taxResponse.status).toEqual('Committed');
  expect(taxResponse.type).toEqual('SalesInvoice');
  expect(taxResponse.taxDate).toEqual(
    `${new Date().getFullYear()}-${
      new Date().getMonth().toString().length != 2 ? '0' : ''
    }${new Date().getMonth() + 1}-${new Date().getDate()}`
  );
  expectGeneralAvaTaxReturn(taxResponse, false);
};

export const expectVoidReturn = (
  orderNumber: string,
  taxResponse: TransactionModel
) => {
  expect(taxResponse.code).toEqual(orderNumber);
  expect(taxResponse.status).toEqual('Cancelled');
  expect(taxResponse.type).toEqual('SalesInvoice');
  expect(taxResponse.taxDate).toEqual(
    `${new Date().getFullYear()}-${
      new Date().getMonth().toString().length != 2 ? '0' : ''
    }${new Date().getMonth() + 1}-${new Date().getDate()}`
  );
  expectGeneralAvaTaxReturn(taxResponse, false);
};

export const expectRefundReturn = (
  orderNumber: string,
  taxResponse: TransactionModel
) => {
  expect(taxResponse.code).toEqual(orderNumber);
  expect(taxResponse.status).toEqual('Committed');
  expect(taxResponse.type).toEqual('ReturnInvoice');
  expect(taxResponse.taxOverrideType).toEqual('TaxDate');
  expect(taxResponse.taxDate).toEqual('2021-06-01');
  expect(taxResponse.date).toEqual(
    `${new Date().getFullYear()}-${
      new Date().getMonth().toString().length != 2 ? '0' : ''
    }${new Date().getMonth() + 1}-${new Date().getDate()}`
  );
  expectGeneralAvaTaxReturn(taxResponse, true);
};
