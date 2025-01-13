import { LineItem } from '@commercetools/platform-sdk';
import {
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../../../client/data.client';

export async function getCategoryTaxCodes(items: Array<LineItem>) {
  const avataxProductAttributeName = process.env
    .AVATAX_PRODUCT_ATTRIBUTE_NAME as string;
  const itemsWithoutTaxCodes = items
    ?.filter(
      (x) =>
        x?.variant?.attributes?.filter(
          (attr) => attr.name === avataxProductAttributeName
        )[0]?.value === undefined
    )
    ?.map((x) => x.variant?.sku);

  const categoryData = await getBulkProductCategories(itemsWithoutTaxCodes);

  const listOfCategories: any = [
    ...new Set(
      categoryData
        .map((x: any) => x.categories)
        .reduce((acc: any, curr: any) => curr?.concat(acc), [])
    ),
  ];

  const catTaxCodes = await getBulkCategoryTaxCode(listOfCategories);

  return categoryData.map((x: any) => ({
    sku: x.sku,
    taxCode: x.categories
      .map((x: any) => catTaxCodes?.find((y) => y.id === x)?.avalaraTaxCode)
      .find((x: any) => x !== undefined),
  }));
}
