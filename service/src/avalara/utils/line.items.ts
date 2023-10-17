import { LineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';

/* Mapping CT LineItem Model to Avalara LineItem Model, 
if there is a simple amount off discount, it is applied directly to the item
prices, so no need to forward it to Avalara */

function itemTaxCode(item: LineItem) {
  const productTaxCode = item?.variant?.attributes?.filter(
    (attr) => attr.name === 'avatax-code'
  )[0]?.value;

  return productTaxCode;
}

export async function lineItem(
  item: LineItem,
  catTaxCodes: [{ [key: string]: string }]
) {
  const lineItem = new LineItemModel();

  const discounted: any = item?.discountedPricePerQuantity;

  const discountedPrice = discounted?.discountedPrice?.value?.centAmount / 100;

  lineItem.quantity = item?.quantity;

  lineItem.amount = discountedPrice || item?.totalPrice?.centAmount / 100;

  lineItem.description = item?.name['en-US'];

  lineItem.itemCode = item?.productKey;

  (lineItem.taxIncluded = item.taxRate?.includedInPrice),
    (lineItem.taxCode =
      itemTaxCode(item) ??
      catTaxCodes.find((x) => x.productKey === item?.productKey)?.taxCode);

  return lineItem;
}
