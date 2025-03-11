import { logger } from '../utils/logger.utils';
import { createApiRoot } from './create.client';
import { Order } from '@commercetools/platform-sdk';

export const getCustomObject = async (container: string) => {
  try {
    return (
      await createApiRoot()
        .customObjects()
        .withContainer({ container: container })
        .get()
        .execute()
    )?.body?.results
      .map((x) => ({ [x.key]: x.value }))
      .reduce((acc, curr) => Object.assign(acc, curr), {});
  } catch (e) {
    logger.error(e);
    return undefined;
  }
};

export const getShippingMethod = async (id: string) => {
  try {
    return (
      await createApiRoot().shippingMethods().withId({ ID: id }).get().execute()
    )?.body;
  } catch (e) {
    logger.error(e);
    return;
  }
};

export const getCustomer = async (id: string) => {
  try {
    return (
      await createApiRoot().customers().withId({ ID: id }).get().execute()
    )?.body;
  } catch (e) {
    logger.error(e);
    return;
  }
};

export const getCategories = async (categories: Array<string>) => {
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
    )?.body?.results;
  } catch (e) {
    logger.error(e);
    return [];
  }
};

export const getProductProjections = async (
  keys: Array<string | undefined>
) => {
  if (!keys.length) return [];
  try {
    return (
      await createApiRoot()
        .productProjections()
        .search()
        .get({
          queryArgs: {
            filter: keys
              .map((x) => `"${x}",`)
              .reduce((acc, curr) => acc + curr, 'variants.sku:')
              .slice(0, -1),
            limit: 500,
          },
        })
        .execute()
    )?.body?.results;
  } catch (e) {
    logger.error(e);
    return [];
  }
};

export const getOrder = async (id: string) => {
  try {
    return (await createApiRoot().orders().withId({ ID: id }).get().execute())
      .body;
  } catch (e) {
    logger.error(e);
    return {} as Order;
  }
};
