import { AdjustmentReason } from 'avatax/lib/enums/AdjustmentReason';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { getOrder } from '../../../client/data.client';
import { Order, ReturnItem } from '@commercetools/platform-sdk';
import { processOrder } from '../preprocess/preprocess.order';
import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { logger } from '../../../utils/logger.utils';

export async function adjustTransactionLines(
  returnItemId: string,
  orderId: string,
  creds: { [key: string]: string },
  originAddress: any,
  config: any,
  logging: string
) {
  let order = await getOrder(orderId);

  const returnItems = extractReturnItems(order, returnItemId);

  if (!returnItems || (returnItems && returnItems.length === 0)) {
    return;
  }

  if (logging === 'debug') {
    logger.debug(
      `Adjusting transaction lines for return item ${returnItemId} in order ${orderId}: ${JSON.stringify(
        returnItems
      )}`
    );
  }

  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'commit',
    order,
    creds?.companyCode,
    originAddress
  );

  taxDocument.adjustmentReason = AdjustmentReason.ProductReturned;

  taxDocument.adjustmentDescription = 'Product Returned';

  taxDocument.createTransactionModel.lines = extractRemainingLines(
    returnItems,
    taxDocument
  );

  const taxResponse = await client.createOrAdjustTransaction({
    model: taxDocument,
  });

  return taxResponse;
}

export async function refundTransactionLines(
  returnItemId: string,
  orderId: string,
  creds: { [key: string]: string },
  originAddress: any,
  config: any,
  logging: string
) {
  const order = await getOrder(orderId);

  const returnItems = extractReturnItems(order, returnItemId);

  if (!returnItems || (returnItems && returnItems.length === 0)) {
    return;
  }

  if (logging === 'debug') {
    logger.debug(
      `Refunding transaction lines for return item ${returnItemId} in order ${orderId}: ${JSON.stringify(
        returnItems
      )}`
    );
  }

  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'refund',
    order,
    creds?.companyCode,
    originAddress
  );

  taxDocument.createTransactionModel.lines = extractRemainingLines(
    returnItems,
    taxDocument
  );

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

function extractRemainingLines(
  returnItems:
    | {
        itemCode: string | undefined;
        quantity: number | undefined;
      }[]
    | undefined,
  taxDocument: CreateOrAdjustTransactionModel
) {
  return taxDocument.createTransactionModel.lines
    .map((line) => {
      let returnItem = returnItems?.find(
        (returnItem) => returnItem.itemCode === line.itemCode
      );
      if (returnItem) {
        let restQuantity =
          (line?.quantity as number) - (returnItem?.quantity as number);
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
}

function extractReturnItems(order: Order, returnItemId: string) {
  const returnInfos = order?.returnInfo
    ?.map((returnInfo) =>
      returnInfo.items.find((item) => item.id === returnItemId)
    )
    .filter(Boolean);

  let returnItems = returnInfos
    ?.filter(
      (item: ReturnItem | undefined) => item?.paymentState === 'Refunded'
    )
    .map((item) => ({
      itemCode: order.lineItems.find((lineItem) => lineItem.id === item?.id)
        ?.variant?.sku,
      quantity: item?.quantity,
    }));

  return returnItems;
}
