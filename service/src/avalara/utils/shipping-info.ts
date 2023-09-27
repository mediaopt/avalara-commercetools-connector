import { ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

// Mapping CT LineItem Model to Avalara LineItem Model
export function shipItem(item: ShippingInfo) {
  const lineItem = new LineItemModel();
  lineItem.quantity = 1;
  lineItem.amount = item.price.centAmount / 100;
  lineItem.description = item.shippingMethodName;
  lineItem.itemCode = 'Shipping';
  //taxIncluded: context?.taxIncluded,
  //discounted: true,
  lineItem.taxCode = 'FR010000';

  return lineItem;
}
