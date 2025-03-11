import { CustomLineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

export function convertCustomLineItemModel(item: CustomLineItem) {
  const lineItem = new LineItemModel();

  lineItem.quantity = item?.quantity;

  lineItem.amount = item?.totalPrice?.centAmount / 100;

  lineItem.itemCode = item?.key ?? item?.id;

  lineItem.description = item?.name?.en;

  lineItem.taxIncluded = item.taxRate?.includedInPrice;

  lineItem.taxCode = item?.custom?.fields?.avalaraTaxCode as string;

  return lineItem;
}
