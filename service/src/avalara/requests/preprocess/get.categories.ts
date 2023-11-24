import { LineItem } from '@commercetools/platform-sdk';
import {
  getBulkCategoryTaxCode,
  getBulkProductCategories,
} from '../../../client/create.client';

export async function getCategoryTaxCodes(items: Array<LineItem>) {
  const itemsWithoutTaxCodes = items
    ?.filter(
      (x) =>
        x?.variant?.attributes?.filter((attr) => attr.name === 'avatax-code')[0]
          ?.value === undefined
    )
    ?.map((x) => x.variant?.sku);

  const categoryData =
    itemsWithoutTaxCodes.length !== 0
      ? await getBulkProductCategories(itemsWithoutTaxCodes)
      : [];

  const listOfCategories: any =
    categoryData.length !== 0
      ? [
          ...new Set(
            categoryData
              .map((x: any) => x.categories)
              .reduce((acc: any, curr: any) => curr.concat(acc), [])
          ),
        ]
      : [];

  const catTaxCodes =
    listOfCategories.length !== 0
      ? await getBulkCategoryTaxCode(listOfCategories)
      : [];

  return listOfCategories.length !== 0
    ? categoryData.map((x: any) => ({
        sku: x.sku,
        taxCode: x.categories
          .map((x: any) => catTaxCodes.find((y) => y.id === x)?.avalaraTaxCode)
          .find((x: any) => x !== undefined),
      }))
    : [];
}
