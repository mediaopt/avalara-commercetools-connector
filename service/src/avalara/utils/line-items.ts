import { LineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

/* Mapping CT LineItem Model to Avalara LineItem Model, 
if there is a simple amount off discount, it is applied directly to the item
prices, so no need to forward it to Avalara */

export function lineItem(item: LineItem) {
  const lineItem = new LineItemModel();
  const discounted: any = item?.discountedPricePerQuantity;
  const discountedPrice = discounted?.discountedPrice?.value?.centAmount / 100;
  lineItem.quantity = item?.quantity;
  lineItem.amount = discountedPrice || item?.totalPrice?.centAmount / 100;
  lineItem.description = item?.name['en-US'];
  lineItem.itemCode = item?.productId;
  //taxIncluded: context?.taxIncluded,
  //lineItem.discounted = true
  //taxCode: taxCode,

  return lineItem;
}
