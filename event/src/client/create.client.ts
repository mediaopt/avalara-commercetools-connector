import { createClient } from './build.client';

import { createApiBuilderFromCtpClient } from '@commercetools/platform-sdk';

import { readConfiguration } from '../utils/config.utils';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

/**
 * Create client with apiRoot
 * apiRoot can now be used to build requests to de Composable Commerce API
 */
export const createApiRoot = ((root?: ByProjectKeyRequestBuilder) => () => {
  if (root) {
    return root;
  }

  root = createApiBuilderFromCtpClient(createClient()).withProjectKey({
    projectKey: readConfiguration().projectKey,
  });

  return root;
})();

/**
 * Example code to get the Project details
 * This code has the same effect as sending a GET
 * request to the commercetools Composable Commerce API without any endpoints.
 *
 * @returns {Promise<ClientResponse<Project>>} apiRoot
 */

// Get custom object container as a js dictionary
export const getData = async (container: string) => {
  const data = (
    await createApiRoot()
      .customObjects()
      .withContainer({ container: container })
      .get()
      .execute()
  )?.body?.results;
  return data
    .map((x) => ({ [x.key]: x.value }))
    .reduce((acc, curr) => Object.assign(acc, curr), {});
};

export const getShipTaxCode = async (id: string) => {
  return (
    (await createApiRoot().shippingMethods().withId({ ID: id }).get().execute())
      ?.body?.custom?.fields?.avalaraTaxCode || ''
  );
};

/*export const getDiscountTaxCode = async (id: string) => {
  return (
    await createApiRoot().cartDiscounts().withId({ ID: id }).get().execute()
  )?.body?.custom?.fields?.avalaraTaxCode;
};*/

export const getCustomerEntityUseCode = async (id: string) => {
  const customer = (
    await createApiRoot().customers().withId({ ID: id }).get().execute()
  )?.body;
  return {
    customerNumber: customer?.customerNumber || id,
    exemptCode: customer?.custom?.fields?.avalaraEntityUseCode || '',
  };
};

export const getBulkCategoryTaxCode = async (cats: Array<string>) => {
  const cs = cats
    .map((x) => `"${x}", `)
    .reduce((acc, curr) => acc + curr, '')
    .slice(0, -2);
  const taxCodes = (
    await createApiRoot()
      .categories()
      .get({ queryArgs: { where: `id in (${cs})` } })
      .execute()
  )?.body?.results.map((x) => ({
    id: x.id,
    avalaraTaxCode: x.custom?.fields?.avalaraTaxCode,
  }));
  return taxCodes;
};

export const getCategoriesOfProduct = async (id: string) => {
  return (await createApiRoot().products().withId({ ID: id }).get().execute())
    ?.body?.masterData?.current?.categories;
};

export const getBulkProductCategories = async (
  keys: Array<string | undefined>
) => {
  const ps = keys
    .map((x) => `"${x}",`)
    .reduce((acc, curr) => acc + curr, 'variants.sku:')
    .slice(0, -1);
  const data = (
    await createApiRoot()
      .productProjections()
      .search()
      .get({ queryArgs: { filter: ps } })
      .execute()
  )?.body?.results;
  const result: any = keys.map((x) => ({
    sku: x,
    categories: data
      .find(
        (y) =>
          y.masterVariant?.sku === x || y.variants.find((z) => z?.sku === x)
      )
      ?.categories.map((x: any) => x.id),
  }));
  return result;
};

export const getOrder = async (id: string) => {
  return (await createApiRoot().orders().withId({ ID: id }).get().execute())
    .body;
};
