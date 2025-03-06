import { expect } from '@jest/globals';
import { TransactionLineModel } from 'avatax/lib/models/TransactionLineModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';

const expectGeneralAvaTaxReturn = (
  taxResponse: TransactionModel,
  refund: boolean,
  lineItemsQuantity: number = 3,
  mainProductQuantity: number = 2,
  totalAmount: number = 166.23,
  totalTax: number = 12.05
) => {
  const coef = refund ? -1 : 1;
  expect(taxResponse.currencyCode).toEqual('USD');
  expect(taxResponse.entityUseCode).toEqual('B');
  expect(taxResponse.customerCode).toEqual('123');
  expect(taxResponse.totalAmount).toEqual(coef * totalAmount);
  expect(taxResponse.totalTax).toEqual(coef * totalTax);
  expect(taxResponse.lines).toHaveLength(lineItemsQuantity);
  const item: TransactionLineModel =
    taxResponse.lines?.find((line) => line.itemCode === 'sku123') ??
    ({} as TransactionLineModel);
  expect(item.description).toEqual('Test Product');
  expect(item.itemCode).toEqual('sku123');
  expect(item.quantity).toEqual(mainProductQuantity);
  expect(item.lineAmount).toEqual(coef * 61.5 * mainProductQuantity);
  expect(item.taxCode).toEqual('PS081282');
  expect(item.tax).toEqual(coef * 4.46 * mainProductQuantity);
  expect(item.taxIncluded).toEqual(false);
  if (!refund) {
    const shipping: TransactionLineModel =
      taxResponse.lines?.find((line) => line.itemCode === 'Shipping') ??
      ({} as TransactionLineModel);
    expect(shipping.description).toEqual('Standard');
    expect(shipping.itemCode).toEqual('Shipping');
    expect(shipping.quantity).toEqual(1);
    expect(shipping.lineAmount).toEqual(coef * 1.23);
    expect(shipping.taxCode).toEqual('PC030000');
    expect(shipping.tax).toEqual(coef * 0.08);
    expect(shipping.taxIncluded).toEqual(false);
  }
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
    new Date().toISOString().substring(0, 10)
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
    new Date().toISOString().substring(0, 10)
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
  expect(taxResponse.date).toEqual(new Date().toISOString().substring(0, 10));
  expectGeneralAvaTaxReturn(taxResponse, true, 2, 2, 165, 11.97);
};

export const expectAdjustedRefundReturn = (
  orderNumber: string,
  taxResponse: TransactionModel,
  locked: boolean
) => {
  const totalAmount = locked ? 103.5 : 104.73;
  const totalTax = locked ? 7.51 : 7.59;
  expect(taxResponse.code).toEqual(orderNumber);
  expect(taxResponse.status).toEqual('Committed');
  expect(taxResponse.adjustmentReason).toEqual(
    locked ? 'NotAdjusted' : 'ProductReturned'
  );
  if (locked) {
    expect(taxResponse.type).toEqual('ReturnInvoice');
    expect(taxResponse.taxOverrideType).toEqual('TaxDate');
    expect(taxResponse.taxDate).toEqual('2021-06-01');
  }
  expect(taxResponse.date).toEqual(new Date().toISOString().substring(0, 10));
  expectGeneralAvaTaxReturn(
    taxResponse,
    locked,
    locked ? 2 : 3,
    1,
    totalAmount,
    totalTax
  );
};
