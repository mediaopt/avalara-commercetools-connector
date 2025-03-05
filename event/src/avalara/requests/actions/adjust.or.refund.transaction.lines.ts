import { AdjustmentReason } from 'avatax/lib/enums/AdjustmentReason';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { getOrder } from '../../../client/data.client';
import { ReturnInfo } from '@commercetools/platform-sdk';
import { processOrder } from '../preprocess/preprocess.order';
import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';

export async function adjustTransactionLines(
  returnInfos: ReturnInfo[],
  orderId: string,
  creds: { [key: string]: string },
  originAddress: any,
  config: any
) {
  let order = await getOrder(orderId);

  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'commit',
    order,
    creds?.companyCode,
    originAddress
  );

  taxDocument.adjustmentReason = AdjustmentReason.ProductReturned;

  taxDocument.adjustmentDescription = 'Product Returned';

  let returnItems = returnInfos
    .map((returnInfo) => {
      return returnInfo.items
        .filter((item) => item.paymentState === 'Refunded')
        .map((item) => ({
          itemCode: order.lineItems.find((lineItem) => lineItem.id === item.id)
            ?.variant?.sku,
          quantity: item.quantity,
        }));
    })
    .flat();

  if (returnItems.length === 0) {
    return;
  }

  taxDocument.createTransactionModel.lines =
    taxDocument.createTransactionModel.lines
      .map((line) => {
        let returnItem = returnItems.find(
          (returnItem) => returnItem.itemCode === line.itemCode
        );
        if (returnItem) {
          let restQuantity = (line?.quantity as number) - returnItem.quantity;
          if (restQuantity < 0) {
            restQuantity = 0;
          }
          const unitAmount = Math.round(
            (line.amount * 100) / (line.quantity as number)
          );
          line.quantity = restQuantity;
          line.amount = (unitAmount * restQuantity) / 100;
        }
        return line;
      })
      .filter((line) => (line?.quantity as number) > 0);

  const taxResponse = await client.createOrAdjustTransaction({
    model: taxDocument,
  });

  return taxResponse;
}

export async function refundTransactionLines(
  returnInfos: ReturnInfo[],
  orderId: string,
  creds: { [key: string]: string },
  originAddress: any,
  config: any
) {
  const order = await getOrder(orderId);

  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'refund',
    order,
    creds?.companyCode,
    originAddress
  );

  let returnItems = returnInfos
    .map((returnInfo) => {
      return returnInfo.items
        .filter((item) => item.paymentState === 'Refunded')
        .map((item) => ({
          itemCode: order.lineItems.find((lineItem) => lineItem.id === item.id)
            ?.variant?.sku,
          quantity: item.quantity,
        }));
    })
    .flat();

  taxDocument.createTransactionModel.lines =
    taxDocument.createTransactionModel.lines
      .map((line) => {
        let returnItem = returnItems.find(
          (returnItem) => returnItem.itemCode === line.itemCode
        );
        if (returnItem) {
          const unitAmount = Math.round(
            (line.amount * 100) / (line.quantity as number)
          );
          line.quantity = returnItem.quantity;
          line.amount = (unitAmount * returnItem.quantity) / 100;
        }
        return line;
      })
      .filter((line) => (line?.quantity as number) > 0);

  taxDocument.createTransactionModel.referenceCode = 'Refund';

  const taxModel = new TaxOverrideModel();
  taxModel.taxDate = new Date(order.createdAt);
  taxModel.type = 3;
  taxModel.reason = 'Refund';
  taxDocument.createTransactionModel.taxOverride = taxModel;

  const taxResponse = await client.createOrAdjustTransaction({
    model: taxDocument,
  });

  return taxResponse;
}
