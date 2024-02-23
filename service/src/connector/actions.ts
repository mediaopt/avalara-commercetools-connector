import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  FieldDefinition,
  TypeAddFieldDefinitionAction,
  TypeDraft,
  TypeRemoveFieldDefinitionAction,
} from '@commercetools/platform-sdk';

export const CART_UPDATE_EXTENSION_KEY =
  'avalara-commercetools-connector-cartUpdateExtension';

export const AVALARA_CATEGORY_TAX_CODE_KEY = 'avalara-category';

export const AVALARA_SHIPPING_TAX_CODE_KEY = 'avalara-shipping-method';

export const AVALARA_ENTITY_USE_CODE_KEY = 'avalara-customer';

export const AVALARA_HASHED_CART_KEY = 'avalara-order';

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
        where: `resourceTypeIds contains all (${customType.resourceTypeIds
          .map((x) => `"${x}", `)
          .reduce((acc, curr) => acc + curr, '')
          .slice(0, -2)})`,
      },
    })
    .execute();
  if (types.length > 0) {
    for (const type of types) {
      const updates = (customType.fieldDefinitions ?? [])
        .filter(
          (newFieldDefinition: FieldDefinition): boolean =>
            !type.fieldDefinitions?.find(
              (existingFieldDefinition: FieldDefinition): boolean =>
                newFieldDefinition.name === existingFieldDefinition.name
            )
        )
        .map(
          (fieldDefinition: FieldDefinition): TypeAddFieldDefinitionAction => {
            return {
              action: 'addFieldDefinition',
              fieldDefinition: fieldDefinition,
            };
          }
        );
      if (updates.length != 0) {
        await apiRoot
          .types()
          .withKey({ key: type.key })
          .post({
            body: {
              version: type.version,
              actions: updates,
            },
          })
          .execute();
      }
    }
    return;
  }
  await apiRoot
    .types()
    .post({
      body: customType,
    })
    .execute();
}

async function deleteOrUpdateCustomType(
  apiRoot: ByProjectKeyRequestBuilder,
  customType: TypeDraft
): Promise<void> {
  const {
    body: { results: types },
  } = await apiRoot
    .types()
    .get({
      queryArgs: {
        where: `resourceTypeIds contains all (${customType.resourceTypeIds
          .map((x) => `"${x}", `)
          .reduce((acc, curr) => acc + curr, '')
          .slice(0, -2)})`,
      },
    })
    .execute();

  if (types.length > 0) {
    for (const type of types) {
      if (type.key === customType.key) {
        await apiRoot
          .types()
          .withKey({ key: AVALARA_ENTITY_USE_CODE_KEY })
          .delete({
            queryArgs: {
              version: type.version,
            },
          })
          .execute();
      } else {
        const updates = (customType.fieldDefinitions ?? [])
          .filter(
            (newFieldDefinition: FieldDefinition): boolean =>
              !!type.fieldDefinitions?.find(
                (existingFieldDefinition: FieldDefinition): boolean =>
                  newFieldDefinition.name === existingFieldDefinition.name
              )
          )
          .map(
            (
              fieldDefinition: FieldDefinition
            ): TypeRemoveFieldDefinitionAction => {
              return {
                action: 'removeFieldDefinition',
                fieldName: fieldDefinition.name,
              };
            }
          );
        if (updates.length != 0) {
          await apiRoot
            .types()
            .withKey({ key: type.key })
            .post({
              body: {
                version: type.version,
                actions: updates,
              },
            })
            .execute();
        }
      }
    }
  }
}

export async function createAvalaraEntityUseCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_ENTITY_USE_CODE_KEY,
    name: {
      en: 'Additional fields to store Avalara Entity Use Codes',
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
  const customType = {
    key: AVALARA_ENTITY_USE_CODE_KEY,
    resourceTypeIds: ['customer'],
    fieldDefinitions: [
      {
        name: 'avalaraEntityUseCode',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
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
        name: 'avalaraHash',
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
  const customType = {
    key: AVALARA_HASHED_CART_KEY,
    resourceTypeIds: ['order'],
    fieldDefinitions: [
      {
        name: 'avalaraHash',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
}

export async function createShippingTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_SHIPPING_TAX_CODE_KEY,
    name: {
      en: 'Additional fields to store Avalara Tax codes for shipping methods',
    },
    resourceTypeIds: ['shipping-method'],
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

export async function deleteShippingTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_SHIPPING_TAX_CODE_KEY,
    resourceTypeIds: ['shipping-method'],
    fieldDefinitions: [
      {
        name: 'avalaraTaxCode',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
}

export async function createCategoryTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_CATEGORY_TAX_CODE_KEY,
    name: {
      en: 'Additional fields to store Avalara Tax codes for categories',
    },
    resourceTypeIds: ['category'],
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
  await addOrUpdateCustomType(apiRoot, customType);
}

export async function deleteCategoryTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: AVALARA_CATEGORY_TAX_CODE_KEY,
    resourceTypeIds: ['category'],
    fieldDefinitions: [
      {
        name: 'avalaraTaxCode',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
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
            condition:
              'shippingAddress is defined AND shippingInfo is defined AND lineItems is not empty',
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
