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
export const getProject = async () => {
  return await createApiRoot().get().execute();
};

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
    await createApiRoot().shippingMethods().withId({ ID: id }).get().execute()
  )?.body?.custom?.fields?.avataxCode;
};

export const getDiscountTaxCode = async (id: string) => {
  return (
    await createApiRoot().cartDiscounts().withId({ ID: id }).get().execute()
  )?.body?.custom?.fields?.avataxCode;
};

export const getCustomerEntityCode = async (id: string) => {
  return (await createApiRoot().customers().withId({ ID: id }).get().execute())
    ?.body?.custom?.fields?.avataxCode;
};

export const getCategoryTaxCode = async (id: string) => {
  return (await createApiRoot().categories().withId({ ID: id }).get().execute())
    ?.body?.custom?.fields?.avataxCode;
};

export const getCategoriesOfProduct = async (id: string) => {
  return (await createApiRoot().products().withId({ ID: id }).get().execute())
    ?.body?.masterData?.current?.categories;
};
