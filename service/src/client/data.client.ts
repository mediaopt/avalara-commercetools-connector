import { logger } from '../utils/logger.utils';
import { createApiRoot } from './create.client';

export const getData = async (container: string) => {
  try {
    return (
      await createApiRoot()
        .customObjects()
        .withContainer({ container: container })
        .get()
        .execute()
    )?.body?.results
      ?.map((x) => ({ [x.key]: x.value }))
      ?.reduce((acc, curr) => Object.assign(acc, curr), {});
  } catch (e) {
    logger.error(e);
    return {};
  }
};

export const getShipTaxCode = async (id: string) => {
  try {
    return (
      await createApiRoot().shippingMethods().withId({ ID: id }).get().execute()
    )?.body?.custom?.fields?.avalaraTaxCode as string;
  } catch (e) {
    logger.error(e);
    return '';
  }
};

export const getCustomerEntityUseCode = async (id: string) => {
  try {
    return (
      await createApiRoot().customers().withId({ ID: id }).get().execute()
    )?.body?.custom?.fields?.avalaraEntityUseCode as string;
  } catch (e) {
    logger.error(e);
    return '';
  }
};

export const getBulkCategoryTaxCode = async (categories: Array<string>) => {
  if (!categories.length) return [];
  try {
    return (
      await createApiRoot()
        .categories()
        .get({
          queryArgs: {
            where: `id in (${categories
              .map((x) => `"${x}", `)
              .reduce((acc, curr) => acc + curr, '')
              .slice(0, -2)})`,
            limit: 500,
          },
        })
        .execute()
    )?.body?.results?.map((x) => ({
      id: x.id,
      avalaraTaxCode: x.custom?.fields?.avalaraTaxCode as string,
    }));
  } catch (e) {
    logger.error(e);
    return [];
  }
};

export const getBulkProductCategories = async (
  keys: Array<string | undefined>
) => {
  try {
    const data = (
      await createApiRoot()
        .productProjections()
        .search()
        .get({
          queryArgs: {
            filter: keys
              .map((x) => `"${x}",`)
              .reduce((acc, curr) => acc + curr, 'variants.sku:')
              .slice(0, -1) as string,
            limit: 500,
          },
        })
        .execute()
    )?.body?.results;
    return keys
      .map((x) => ({
        sku: x as string,
        categories: data
          ?.find(
            (y) =>
              y?.masterVariant?.sku === x ||
              y?.variants?.find((z) => z?.sku === x)
          )
          ?.categories?.map((x: any) => x.id) as string[],
      }))
      .filter((x) => x.categories && x.categories.length > 0);
  } catch (e) {
    logger.error(e);
    return [];
  }
};
