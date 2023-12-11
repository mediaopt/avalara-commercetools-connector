import { ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { getShipTaxCode } from '../../client/create.client';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

// Mapping CT LineItem Model to Avalara LineItem Model
export async function shipItem(item: ShippingInfo, apiRoot: ByProjectKeyRequestBuilder) {
  const lineItem = new LineItemModel();

  const taxCode = await getShipTaxCode(item.shippingMethod?.id || '', apiRoot);

  lineItem.quantity = 1;

  lineItem.amount = item.price.centAmount / 100;

  lineItem.itemCode = 'Shipping';

  lineItem.taxIncluded = item.taxRate?.includedInPrice;

  lineItem.taxCode = taxCode || 'FR010000';

  return lineItem;
}
