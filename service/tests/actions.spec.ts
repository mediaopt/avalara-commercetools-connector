import { describe, expect, test, jest } from '@jest/globals';
import {
  CART_UPDATE_EXTENSION_KEY,
  createAvalaraEntityUseCodeFields,
  createShippingTaxCodeFields,
  createCategoryTaxCodeFields,
  createCartUpdateExtension,
  createAvalaraHashedCartField,
  createCustomLineItemTaxCodeFields,
  deleteAvalaraEntityUseCodeFields,
  deleteShippingTaxCodeFields,
  deleteCategoryTaxCodeFields,
  deleteCartUpdateExtension,
  deleteAvalaraHashedCartField,
  deleteCustomLineItemTaxCodeFields,
} from '../src/connector/actions';

describe('Testing actions', () => {
  test('create extension', async () => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{ version: 1 }] } })),
    };
    const apiRoot: any = {
      extensions: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };
    await createCartUpdateExtension(apiRoot, 'https://lorem.ipsum');
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRoot.post).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(3);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `key = "${CART_UPDATE_EXTENSION_KEY}"`,
      },
    });

    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });

    expect(apiRoot.post).toBeCalledWith({
      body: {
        key: CART_UPDATE_EXTENSION_KEY,
        destination: {
          type: 'HTTP',
          url: 'https://lorem.ipsum',
        },
        triggers: [
          {
            resourceTypeId: 'cart',
            actions: ['Create', 'Update'],
            condition:
              'shippingAddress is defined AND (shippingInfo is defined OR shipping is not empty) AND lineItems is not empty',
          },
        ],
      },
    });
  });

  test('delete extension', async () => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{ version: 1 }] } })),
    };
    const apiRoot: any = {
      extensions: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
    };
    await deleteCartUpdateExtension(apiRoot);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(2);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `key = "${CART_UPDATE_EXTENSION_KEY}"`,
      },
    });

    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });
  });

  test.each([
    {
      method: createAvalaraEntityUseCodeFields,
      customType: {
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
      },
    },
    {
      method: createShippingTaxCodeFields,
      customType: {
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
      },
    },
    {
      method: createCategoryTaxCodeFields,
      customType: {
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
      },
    },
    {
      method: createAvalaraHashedCartField,
      customType: {
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
      },
    },
    {
      method: createCustomLineItemTaxCodeFields,
      customType: {
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
      },
    },
  ])('$method', async ({ method, customType }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: {
          results: [{ version: 1, key: customType.key, fieldDefinitions: [] }],
        },
      })),
    };
    const apiRoot: any = {
      types: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      post: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
    };
    await method(apiRoot);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.post).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(2);
    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `resourceTypeIds contains any ("${customType.resourceTypeIds[0]}")`,
      },
    });

    expect(apiRoot.post).toBeCalledWith({
      body: {
        version: 1,
        actions: [
          {
            action: 'addFieldDefinition',
            fieldDefinition: customType.fieldDefinitions[0],
          },
        ],
      },
    });
  });

  test.each([
    {
      method: deleteAvalaraEntityUseCodeFields,
      customType: {
        key: process.env.CUSTOMER_CUSTOM_TYPE_KEY,
        resourceTypeIds: ['customer'],
        fieldDefinitions: [
          {
            name: 'avalaraEntityUseCode',
          },
        ],
      },
    },
    {
      method: deleteShippingTaxCodeFields,
      customType: {
        key: process.env.SHIPPING_METHOD_CUSTOM_TYPE_KEY,
        resourceTypeIds: ['shipping-method'],
        fieldDefinitions: [
          {
            name: 'avalaraTaxCode',
          },
        ],
      },
    },
    {
      method: deleteCategoryTaxCodeFields,
      customType: {
        key: process.env.CATEGORY_CUSTOM_TYPE_KEY,
        resourceTypeIds: ['category'],
        fieldDefinitions: [
          {
            name: 'avalaraTaxCode',
          },
        ],
      },
    },
    {
      method: deleteAvalaraHashedCartField,
      customType: {
        key: process.env.ORDER_CUSTOM_TYPE_KEY,
        resourceTypeIds: ['order'],
        fieldDefinitions: [
          {
            name: 'avalaraHash',
          },
        ],
      },
    },
    {
      method: deleteCustomLineItemTaxCodeFields,
      customType: {
        key: process.env.CUSTOM_LINE_ITEM_CUSTOM_TYPE_KEY,
        resourceTypeIds: ['custom-line-item'],
        fieldDefinitions: [
          {
            name: 'avalaraTaxCode',
          },
        ],
      },
    },
  ])('delete types', async ({ method, customType }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: {
          results: [
            {
              version: 1,
              key: customType.key,
              fieldDefinitions: customType.fieldDefinitions,
            },
          ],
        },
      })),
    };
    const apiRoot: any = {
      types: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };
    await method(apiRoot);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(2);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `resourceTypeIds contains any ("${customType.resourceTypeIds[0]}")`,
      },
    });
    expect(apiRoot.withKey).toBeCalledWith({ key: customType.key });
    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });
  });
});
