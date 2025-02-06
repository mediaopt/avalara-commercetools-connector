import { Shipping } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

// Mapping CT LineItem Model to Avalara LineItem Model
export async function customShipItem(type: string, item: Shipping) {
  const lineItem = new LineItemModel();

  const taxCode = item?.shippingCustomFields?.fields?.avalaraTaxCode as string;

  lineItem.quantity = 1;

  lineItem.amount =
    ((type === 'refund' ? -1 : 1) *
      (item.shippingInfo.discountedPrice?.value?.centAmount ??
        item.shippingInfo?.price.centAmount)) /
    100;

  lineItem.itemCode = item.shippingKey;

  lineItem.taxIncluded = item.shippingInfo?.taxRate?.includedInPrice;

  lineItem.taxCode = taxCode || 'FR010000';

  lineItem.description = item.shippingInfo?.shippingMethodName;

  return lineItem;
}
