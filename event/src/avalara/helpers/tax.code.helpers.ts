import { CustomFields, LineItem } from '@commercetools/platform-sdk';
import {
  getCategories,
  getProductProjections,
  getShippingMethod,
} from '../../client/data.client';
import {
  CategoryWithTaxCode,
  ProductWithCategories,
  ProductWithCategoryTaxCode,
} from '../types/index.types';

export function extractItemTaxCode(item: LineItem) {
  const avataxProductAttributeName = process.env
    .AVATAX_PRODUCT_ATTRIBUTE_NAME as string;

  return item?.variant?.attributes?.filter(
    (attr) => attr?.name === avataxProductAttributeName
  )[0]?.value as string | undefined;
}

export async function extractShippingMethodTaxCode(
  shippingMethodId: string | undefined,
  shippingCustomFields: CustomFields | undefined
) {
  if (shippingCustomFields) {
    return shippingCustomFields.fields?.avalaraTaxCode as string;
  }

  if (shippingMethodId) {
    const shippingMethod = await getShippingMethod(shippingMethodId);
    return shippingMethod?.custom?.fields?.avalaraTaxCode as string;
  }
  return;
}

export async function extractTaxCodesFromCategories(items: Array<LineItem>) {
  const avataxProductAttributeName = process.env
    .AVATAX_PRODUCT_ATTRIBUTE_NAME as string;

  const lineItemsWithoutTaxCodes = items
    ?.filter(
      (x) =>
        x?.variant?.attributes?.filter(
          (attr) => attr.name === avataxProductAttributeName
        )[0]?.value === undefined
    )
    ?.map((x) => x.variant?.sku);

  const productProjections = await getProductProjections(
    lineItemsWithoutTaxCodes
  );

  const productsWithCategories = lineItemsWithoutTaxCodes
    .map(
      (x) =>
        ({
          sku: x as string,
          categories: productProjections
            .find(
              (y) =>
                y?.masterVariant?.sku === x ||
                y?.variants?.find((z) => z?.sku === x)
            )
            ?.categories.map((x) => x.id) as string[],
        }) as ProductWithCategories
    )
    .filter((x) => x.categories && x.categories.length);

  const categoriesList = [
    ...new Set(
      productsWithCategories
        .map((x) => x.categories)
        .reduce((acc, curr) => curr?.concat(acc), [])
    ),
  ];

  const categoriesWithTaxCodes = (await getCategories(categoriesList)).map(
    (x) =>
      ({
        id: x.id,
        avalaraTaxCode: x.custom?.fields?.avalaraTaxCode as string,
      }) as CategoryWithTaxCode
  );

  return productsWithCategories.map(
    (x) =>
      ({
        sku: x.sku,
        taxCode: x.categories
          .map(
            (x) =>
              categoriesWithTaxCodes?.find((y) => y.id === x)?.avalaraTaxCode
          )
          .find((x) => x !== undefined),
      }) as ProductWithCategoryTaxCode
  );
}
