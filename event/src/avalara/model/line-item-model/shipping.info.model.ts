import { CustomFields, ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { extractShippingMethodTaxCode } from '../../helpers/tax.code.helpers';

// Mapping CT LineItem Model to Avalara LineItem Model
export async function convertShippingInfoModel(
  item: ShippingInfo,
  shippingCustomFields: CustomFields | undefined
) {
  const lineItem = new LineItemModel();

  lineItem.quantity = 1;

  lineItem.amount =
    (item.discountedPrice?.value?.centAmount ?? item?.price?.centAmount) / 100;

  lineItem.description = item.shippingMethodName;
  lineItem.itemCode = 'Shipping';
  lineItem.taxIncluded = item.taxRate?.includedInPrice;
  lineItem.taxCode =
    (await extractShippingMethodTaxCode(
      item?.shippingMethod?.id,
      shippingCustomFields
    )) || 'FR010000';

  return lineItem;
}
