import { ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { getShipTaxCode } from '../../client/data.client';

// Mapping CT LineItem Model to Avalara LineItem Model
export async function shipItem(item: ShippingInfo) {
  const lineItem = new LineItemModel();

  const taxCode = await getShipTaxCode(item.shippingMethod?.id as string);

  lineItem.quantity = 1;

  lineItem.amount =
    (item.discountedPrice?.value?.centAmount ?? item.price.centAmount) / 100;

  lineItem.itemCode = 'Shipping';

  lineItem.taxIncluded = item.taxRate?.includedInPrice;

  lineItem.taxCode = taxCode || 'FR010000';

  return lineItem;
}
