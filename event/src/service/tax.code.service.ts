import { CustomFields, LineItem } from '@commercetools/platform-sdk';
import {
  getCategories,
  getProductProjections,
  getShippingMethod,
} from '../client/get.client';
import { CategoryWithTaxCode, ProductWithCategories } from './types';
import { ProductWithTaxCode } from '@mediaopt/avalara-commercetools-lib';

export function extractItemTaxCode(item: LineItem) {
  const avataxProductAttributeName = process.env
    .AVATAX_PRODUCT_ATTRIBUTE_NAME as string;

  return item.variant.attributes?.filter(
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

export async function extractProductsWithTaxCodes(
  items: LineItem[]
): Promise<ProductWithTaxCode[]> {
  const avataxProductAttributeName = process.env
    .AVATAX_PRODUCT_ATTRIBUTE_NAME as string;

  const lineItemsWithoutTaxCodes = items
    .filter(
      (x) =>
        x.variant.attributes?.filter(
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

  return items.map(
    (x) =>
      ({
        sku: x.variant.sku,
        taxCode:
          extractItemTaxCode(x) ??
          productsWithCategories
            .find((p) => p.sku === x.variant.sku)
            ?.categories.map(
              (x) =>
                categoriesWithTaxCodes?.find((y) => y.id === x)?.avalaraTaxCode
            )
            .find((x) => x !== undefined),
      }) as ProductWithTaxCode
  );
}
