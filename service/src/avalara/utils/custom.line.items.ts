import { CustomLineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

export function customLineItem(item: CustomLineItem) {
  const lineItem = new LineItemModel();

  const discounted: any = item?.discountedPricePerQuantity;

  const discountedPrice = discounted?.discountedPrice?.value?.centAmount;

  lineItem.quantity = item?.quantity;

  lineItem.amount = (discountedPrice ?? item?.totalPrice?.centAmount) / 100;

  lineItem.itemCode = item?.key ?? item?.id;

  lineItem.taxIncluded = item.taxRate?.includedInPrice;

  lineItem.taxCode = item?.custom?.fields?.avalaraTaxCode as string;

  return lineItem;
}
