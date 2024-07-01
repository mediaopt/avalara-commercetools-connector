import { LineItem } from '@commercetools/platform-sdk';
import {
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../../../client/data.client';

export async function getCategoryTaxCodes(items: Array<LineItem>) {
  const itemsWithoutTaxCodes = items
    ?.filter(
      (x) =>
        x?.variant?.attributes?.filter((attr) => attr.name === 'avatax-code')[0]
          ?.value === undefined
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
      .map((x: any) => catTaxCodes.find((y) => y.id === x)?.avalaraTaxCode)
      .find((x: any) => x !== undefined),
  }));
}
