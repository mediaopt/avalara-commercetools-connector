import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  FieldDefinition,
  TypeAddFieldDefinitionAction,
  TypeDraft,
} from '@commercetools/platform-sdk';

export const CART_UPDATE_EXTENSION_KEY =
  'avalara-commercetools-connector-cartUpdateExtension';

export const AVALARA_TAX_CODES_KEY = 'avalara-tax-codes';

export const AVALARA_ENTITY_USE_CODES_KEY = 'avalara-entity-use-codes';

export const AVALARA_HASHED_CART_KEY = 'avalara-hashed-cart';

//const CART_DISCOUNT_TYPE_KEY = 'myconnector-cartDiscountType';

async function addOrUpdateCustomType(
  apiRoot: ByProjectKeyRequestBuilder,
  customType: TypeDraft
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${customType.key}"`,
      },
    })
    .execute();
  if (types.length > 0) {
    const type = types[0];
    const updates = (customType.fieldDefinitions ?? [])
      .filter(
        (newFieldDefinition: FieldDefinition): boolean =>
          !type.fieldDefinitions?.find(
            (existingFieldDefinition: FieldDefinition): boolean =>
              newFieldDefinition.name === existingFieldDefinition.name
          )
      )
      .map((fieldDefinition: FieldDefinition): TypeAddFieldDefinitionAction => {
        return {
          action: 'addFieldDefinition',
          fieldDefinition: fieldDefinition,
        };
      });
    if (updates.length === 0) {
      return;
    }
    await apiRoot
      .types()
      .withKey({ key: customType.key })
      .post({
        body: {
          version: type.version,
          actions: updates,
        },
      })
      .execute();
    return;
  }
  await apiRoot
    .types()
    .post({
      body: customType,
    })
    .execute();
}

export async function createAvalaraEntityUseCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
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
  } as TypeDraft;
  await addOrUpdateCustomType(apiRoot, customType);
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
        where: `key = "${AVALARA_ENTITY_USE_CODES_KEY}"`,
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

export async function createAvalaraHashedCartField(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_HASHED_CART_KEY,
    name: {
      en: 'Additional field to store Avalara Cart Hash',
    },
    resourceTypeIds: ['order'],
    fieldDefinitions: [
      {
        name: 'avahash',
        label: {
          en: 'Avalara Cart Hash',
        },
        required: false,
        type: {
          name: 'String',
        },
        inputHint: 'SingleLine',
      },
    ],
  } as TypeDraft;
  await addOrUpdateCustomType(apiRoot, customType);
}

export async function deleteAvalaraHashedCartField(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `key = "${AVALARA_HASHED_CART_KEY}"`,
      },
    })
    .execute();

  if (types.length > 0) {
    const type = types[0];

    await apiRoot
      .types()
      .withKey({ key: AVALARA_HASHED_CART_KEY })
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
  const customType = {
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
  } as TypeDraft;
  addOrUpdateCustomType(apiRoot, customType);
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
        where: `key = "${AVALARA_TAX_CODES_KEY}"`,
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
