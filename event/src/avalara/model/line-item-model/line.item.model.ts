import { LineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import { extractItemTaxCode } from '../../helpers/tax.code.helpers';
import { ProductWithCategoryTaxCode } from '../../types/index.types';
/* Mapping CT LineItem Model to Avalara LineItem Model, 
if there is a simple amount off discount, it is applied directly to the item
prices, so no need to forward it to Avalara */

export function convertLineItemModel(
  item: LineItem,
  productsWithCategoryTaxCodes: ProductWithCategoryTaxCode[]
) {
  const lineItem = new LineItemModel();

  lineItem.quantity = item?.quantity;

  lineItem.amount = item?.totalPrice?.centAmount / 100;

  lineItem.description = item?.name?.en;

  lineItem.itemCode = item?.variant?.sku;

  lineItem.taxIncluded = item?.taxRate?.includedInPrice;
  lineItem.taxCode =
    extractItemTaxCode(item) ??
    productsWithCategoryTaxCodes?.find((x) => x?.sku === item?.variant?.sku)
      ?.taxCode;

  return lineItem;
}
