import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { convertTransactionLineItemModeltoLineItemModel } from './transaction.model.helpers';
import { Order, ReturnItem } from '@commercetools/platform-sdk';
import { ReturnItemHelper } from '../types/index.types';

export function extractRemainingLines(
  returnItems: ReturnItemHelper[],
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

export function extractRefundLines(
  returnItems: ReturnItemHelper[],
  taxDocument: CreateOrAdjustTransactionModel
) {
  return taxDocument.createTransactionModel.lines
    .map((line) => {
      let returnItem = returnItems?.find(
        (returnItem) => returnItem.itemCode === line.itemCode
      );
      if (returnItem) {
        const unitAmount = Math.round(
          (line.amount * 100) / (line.quantity as number)
        );
        const quantity = returnItem?.quantity as number;
        line.quantity = quantity;
        line.amount = -(unitAmount * quantity) / 100;
      } else {
        line.quantity = 0;
      }
      return line;
    })
    .filter((line) => (line?.quantity as number) > 0);
}

export function addRefundLines(
  returnItems: ReturnItemHelper[],
  salesInvoiceTransaction: TransactionModel,
  taxDocument: CreateOrAdjustTransactionModel
) {
  return taxDocument.createTransactionModel.lines.concat(
    (
      salesInvoiceTransaction.lines?.map(
        convertTransactionLineItemModeltoLineItemModel
      ) || []
    )
      .filter((line) => {
        let returnItem = returnItems?.find(
          (returnItem) => returnItem.itemCode === line.itemCode
        );
        return returnItem && returnItem.quantity;
      })
      .map((line) => {
        let returnItem = returnItems?.find(
          (returnItem) => returnItem.itemCode === line.itemCode
        );
        if (returnItem) {
          const unitAmount = Math.round(
            (line.amount * 100) / (line.quantity as number)
          );
          const quantity = returnItem?.quantity as number;
          line.quantity = quantity;
          line.amount = -(unitAmount * quantity) / 100;
        } else {
          line.quantity = 0;
        }
        return line;
      })
  );
}

export function extractReturnItems(order: Order, returnItemId: string) {
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
      itemCode: order.lineItems.find(
        (lineItem) => lineItem.id === (item as any)?.lineItemId
      )?.variant?.sku,
      quantity: item?.quantity,
    }))
    .filter((item) => item?.itemCode && item?.quantity)
    .map((item) => ({
      itemCode: item?.itemCode as string,
      quantity: item?.quantity as number,
    }));

  return returnItems;
}
