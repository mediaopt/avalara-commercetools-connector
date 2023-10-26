import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

const CART_UPDATE_EXTENSION_KEY =
  'avalara-commercetools-connector-cartUpdateExtension';

const AVALARA_TAX_CODES_KEY = 'avalara-tax-codes';

const AVALARA_ENTITY_USE_CODES_KEY = 'avalara-entity-use-codes';

//const CART_DISCOUNT_TYPE_KEY = 'myconnector-cartDiscountType';

export async function createAvalaraEntityUseCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = ${AVALARA_ENTITY_USE_CODES_KEY}`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: AVALARA_ENTITY_USE_CODES_KEY })
      .delete({
        queryArgs: {
          version: type.version,
        },
      })
      .execute();
  }

  await apiRoot
    .types()
    .post({
      body: {
        key: AVALARA_ENTITY_USE_CODES_KEY,
        name: {
          en: 'Additional field to store Avalara Entity Use codes',
        },
        resourceTypeIds: ['customer'],
        fieldDefinitions: [
          {
            name: 'avalaraEntityUseCode',
            label: {
              en: 'Avalara Entity Use code',
            },
            required: false,
            type: {
              name: 'String',
            },
            inputHint: 'SingleLine',
          },
        ],
      },
    })
    .execute();
}

export async function deleteAvalaraEntityUseCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = ${AVALARA_ENTITY_USE_CODES_KEY}`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: AVALARA_ENTITY_USE_CODES_KEY })
      .delete({
        queryArgs: {
          version: type.version,
        },
      })
      .execute();
  }
}

export async function createAvalaraTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = ${AVALARA_TAX_CODES_KEY}`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: AVALARA_TAX_CODES_KEY })
      .delete({
        queryArgs: {
          version: type.version,
        },
      })
      .execute();
  }

  await apiRoot
    .types()
    .post({
      body: {
        key: AVALARA_TAX_CODES_KEY,
        name: {
          en: 'Additional field to store Avalara Tax codes',
        },
        resourceTypeIds: ['category', 'shipping-method', 'cart-discount'],
        fieldDefinitions: [
          {
            name: 'avalaraTaxCode',
            label: {
              en: 'Avalara Tax code',
            },
            required: false,
            type: {
              name: 'String',
            },
            inputHint: 'SingleLine',
          },
        ],
      },
    })
    .execute();
}

export async function deleteAvalaraTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = ${AVALARA_TAX_CODES_KEY}`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: AVALARA_TAX_CODES_KEY })
      .delete({
        queryArgs: {
          version: type.version,
        },
      })
      .execute();
  }
}

export async function createCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder,
  applicationUrl: string
): Promise<void> {
  const {
    body: { results: extensions },
  } = await apiRoot
    .extensions()
    .get({
      queryArgs: {
        where: `key = "${CART_UPDATE_EXTENSION_KEY}"`,
      },
    })
    .execute();

  if (extensions.length > 0) {
    const extension = extensions[0];

    await apiRoot
      .extensions()
      .withKey({ key: CART_UPDATE_EXTENSION_KEY })
      .delete({
        queryArgs: {
          version: extension.version,
        },
      })
      .execute();
  }

  await apiRoot
    .extensions()
    .post({
      body: {
        key: CART_UPDATE_EXTENSION_KEY,
        destination: {
          type: 'HTTP',
          url: applicationUrl,
        },
        triggers: [
          {
            resourceTypeId: 'cart',
            actions: ['Create', 'Update'],
          },
        ],
      },
    })
    .execute();
}

export async function deleteCartUpdateExtension(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: extensions },
  } = await apiRoot
    .extensions()
    .get({
      queryArgs: {
        where: `key = "${CART_UPDATE_EXTENSION_KEY}"`,
      },
    })
    .execute();

  if (extensions.length > 0) {
    const extension = extensions[0];

    await apiRoot
      .extensions()
      .withKey({ key: CART_UPDATE_EXTENSION_KEY })
      .delete({
        queryArgs: {
          version: extension.version,
        },
      })
      .execute();
  }
}

/*export async function createCustomCartDiscountType(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${CART_DISCOUNT_TYPE_KEY}"`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: CART_DISCOUNT_TYPE_KEY })
      .delete({
        queryArgs: {
          version: type.version,
        },
      })
      .execute();
  }

  await apiRoot
    .types()
    .post({
      body: {
        key: CART_DISCOUNT_TYPE_KEY,
        name: {
          en: 'Custom type to store a string',
        },
        resourceTypeIds: ['cart-discount'],
        fieldDefinitions: [
          {
            type: {
              name: 'String',
            },
            name: 'customCartField',
            label: {
              en: 'Custom cart field',
            },
            required: false,
          },
        ],
      },
    })
    .execute();
}*/
