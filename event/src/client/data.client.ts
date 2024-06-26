import { createApiRoot } from './create.client';

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
  )?.body?.custom?.fields?.avalaraTaxCode as string;
};

export const getCustomerEntityUseCode = async (id: string) => {
  const customer = (
    await createApiRoot().customers().withId({ ID: id }).get().execute()
  )?.body;
  return {
    customerNumber: customer?.customerNumber || id,
    exemptCode: customer?.custom?.fields?.avalaraEntityUseCode as string,
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
      .get({ queryArgs: { where: `id in (${cs})`, limit: 500 } })
      .execute()
  )?.body?.results.map((x) => ({
    id: x.id,
    avalaraTaxCode: x.custom?.fields?.avalaraTaxCode,
  }));
  return taxCodes;
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
      .get({ queryArgs: { filter: ps, limit: 500 } })
      .execute()
  )?.body?.results;
  const result: any = keys.map((x) => ({
    sku: x,
    categories: data
      .find(
        (y) =>
          y?.masterVariant?.sku === x || y?.variants?.find((z) => z?.sku === x)
      )
      ?.categories.map((x: any) => x.id),
  }));
  return result;
};

export const getOrder = async (id: string) => {
  return (await createApiRoot().orders().withId({ ID: id }).get().execute())
    .body;
};
