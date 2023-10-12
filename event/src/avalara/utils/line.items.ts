import { LineItem } from '@commercetools/platform-sdk';
import { LineItemModel } from 'avatax/lib/models/LineItemModel';
import {
  getCategoriesOfProduct,
  getCategoryTaxCode,
} from '../../client/create.client';

/* Mapping CT LineItem Model to Avalara LineItem Model, 
if there is a simple amount off discount, it is applied directly to the item
prices, so no need to forward it to Avalara */

async function itemTaxCode(item: LineItem) {
  const id = item?.productId;
  const categories = await getCategoriesOfProduct(id);
  const taxCodes = await Promise.all(
    categories.map(async (x) => await getCategoryTaxCode(x.id))
  );
  const categoryTaxCode = taxCodes.find((el) => el !== undefined);
  const productTaxCode = item?.variant?.attributes?.filter(
    (attr) => attr.name === 'ava-tax-code'
  )[0]?.value;
  return productTaxCode || categoryTaxCode || '';
}

export async function lineItem(item: LineItem) {
  const lineItem = new LineItemModel();
  const discounted: any = item?.discountedPricePerQuantity;
  const discountedPrice = discounted?.discountedPrice?.value?.centAmount / 100;
  lineItem.quantity = item?.quantity;
  lineItem.amount = discountedPrice || item?.totalPrice?.centAmount / 100;
  lineItem.description = item?.name['en-US'];
  lineItem.itemCode = item?.productId;
  (lineItem.taxIncluded = item.taxRate?.includedInPrice),
    (lineItem.taxCode = await itemTaxCode(item));

  return lineItem;
}
