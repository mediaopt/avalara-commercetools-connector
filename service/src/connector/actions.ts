import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';
import {
  FieldDefinition,
  TypeAddFieldDefinitionAction,
  TypeDraft,
  TypeRemoveFieldDefinitionAction,
} from '@commercetools/platform-sdk';

export const CART_UPDATE_EXTENSION_KEY =
  'avalara-connector-cartUpdateExtension';

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
        where: `resourceTypeIds contains any ("${customType.resourceTypeIds[0]}")`,
      },
    })
    .execute();
  for (const type of types) {
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
  if (!types.find((type) => type.key === customType.key)) {
    await apiRoot
      .types()
      .post({
        body: customType,
      })
      .execute();
  }
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
        where: `resourceTypeIds contains any ("${customType.resourceTypeIds[0]}")`,
      },
    })
    .execute();

  for (const type of types) {
    const updates = (customType.fieldDefinitions ?? [])
      .filter(
        (newFieldDefinition: FieldDefinition): boolean =>
          !!type.fieldDefinitions?.find(
            (existingFieldDefinition: FieldDefinition): boolean =>
              newFieldDefinition.name === existingFieldDefinition.name
          )
      )
      .map(
        (fieldDefinition: FieldDefinition): TypeRemoveFieldDefinitionAction => {
          return {
            action: 'removeFieldDefinition',
            fieldName: fieldDefinition.name,
          };
        }
      );
    if (updates.length != 0) {
      if (type.fieldDefinitions?.length === 1) {
        await apiRoot
          .types()
          .withKey({ key: type.key })
          .delete({
            queryArgs: {
              version: type.version,
            },
          })
          .execute();
      } else {
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

export async function createCustomShippingTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: process.env.CUSTOM_SHIPPING_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.CUSTOM_SHIPPING_CUSTOM_TYPE_NAME,
    },
    resourceTypeIds: ['shipping'],
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

export async function deleteCustomShippingTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: process.env.CUSTOM_SHIPPING_CUSTOM_TYPE_KEY,
    resourceTypeIds: ['shipping'],
    fieldDefinitions: [
      {
        name: 'avalaraTaxCode',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
}

export async function createCustomLineItemTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: process.env.CUSTOM_LINE_ITEM_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.CUSTOM_LINE_ITEM_CUSTOM_TYPE_NAME,
    },
    resourceTypeIds: ['custom-line-item'],
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

export async function deleteCustomLineItemTaxCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: process.env.CUSTOM_LINE_ITEM_CUSTOM_TYPE_KEY,
    resourceTypeIds: ['custom-line-item'],
    fieldDefinitions: [
      {
        name: 'avalaraTaxCode',
      },
    ],
  } as unknown as TypeDraft;
  await deleteOrUpdateCustomType(apiRoot, customType);
}

export async function createAvalaraEntityUseCodeFields(
  apiRoot: ByProjectKeyRequestBuilder
): Promise<void> {
  const customType = {
    key: process.env.CUSTOMER_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.CUSTOMER_CUSTOM_TYPE_NAME,
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
    key: process.env.CUSTOMER_CUSTOM_TYPE_KEY,
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
    key: process.env.ORDER_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.ORDER_CUSTOM_TYPE_NAME,
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
    key: process.env.ORDER_CUSTOM_TYPE_KEY,
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
    key: process.env.SHIPPING_METHOD_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.SHIPPING_METHOD_CUSTOM_TYPE_NAME,
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
    key: process.env.SHIPPING_METHOD_CUSTOM_TYPE_KEY,
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
    key: process.env.CATEGORY_CUSTOM_TYPE_KEY,
    name: {
      en: process.env.CATEGORY_CUSTOM_TYPE_NAME,
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
    key: process.env.CATEGORY_CUSTOM_TYPE_KEY,
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
