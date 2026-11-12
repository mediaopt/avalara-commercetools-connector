import { CustomFields, ShippingInfo } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { getShipTaxCode } from '../../client/data.client';
import {
  CUSTOM_SHIPPING_TAX_CODE_FIELD,
  FALLBACK_SHIPPING_TAX_CODE,
} from '../../utils/consts.utils';
import { logger } from '../../utils/logger.utils';

// Mapping CT LineItem Model to Avalara LineItem Model
export async function shipItem(
  item: ShippingInfo,
  shippingCustomFields: CustomFields | undefined
) {
  const lineItem = new LineItemModel();

  const taxCode = shippingCustomFields
    ? (shippingCustomFields.fields?.[CUSTOM_SHIPPING_TAX_CODE_FIELD] as string)
    : item.shippingMethod?.id
      ? await getShipTaxCode(item.shippingMethod?.id as string)
      : undefined;

  lineItem.quantity = 1;

  lineItem.amount =
    (item.discountedPrice?.value?.centAmount ?? item.price.centAmount) / 100;

  lineItem.itemCode = 'Shipping';

  lineItem.taxIncluded = item.taxRate?.includedInPrice;

  if (!taxCode) {
    logger.warn(
      `No Avalara shipping tax code resolved${
        shippingCustomFields
          ? ` from the custom shipping field '${CUSTOM_SHIPPING_TAX_CODE_FIELD}'`
          : ''
      }; falling back to '${FALLBACK_SHIPPING_TAX_CODE}'.`
    );
  }

  lineItem.taxCode = taxCode || FALLBACK_SHIPPING_TAX_CODE;

  return lineItem;
}
