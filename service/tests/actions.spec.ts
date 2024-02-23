import { describe, expect, test, jest } from '@jest/globals';
import {
  CART_UPDATE_EXTENSION_KEY,
  createAvalaraEntityUseCodeFields,
  createTaxCodeFields,
  createCartUpdateExtension,
  createAvalaraHashedCartField,
  deleteAvalaraEntityUseCodeFields,
  deleteTaxCodeFields,
  deleteCartUpdateExtension,
  deleteAvalaraHashedCartField,
  AVALARA_ENTITY_USE_CODE_KEY,
  AVALARA_HASHED_CART_KEY,
  AVALARA_TAX_CODE_KEY,
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
              'shippingAddress is defined AND shippingInfo is defined AND lineItems is not empty',
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
      },
    },
    {
      method: createTaxCodeFields,
      customType: {
        key: AVALARA_TAX_CODE_KEY,
        name: {
          en: 'Additional fields to store Avalara Tax Codes',
        },
        resourceTypeIds: ['shipping-method', 'category'],
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
      },
    },
  ])('$method', async ({ method, customType }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: {
          results: [{ version: 1, fieldDefinitions: [] }],
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
        where: `resourceTypeIds contains any (${customType.resourceTypeIds
          .map((x) => `"${x}", `)
          .reduce((acc, curr) => acc + curr, '')
          .slice(0, -2)})`,
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
        key: AVALARA_ENTITY_USE_CODE_KEY,
        resourceTypeIds: ['customer'],
        fieldDefinitions: [
          {
            name: 'avalaraEntityUseCode',
          },
        ],
      },
    },
    {
      method: deleteTaxCodeFields,
      customType: {
        key: AVALARA_TAX_CODE_KEY,
        resourceTypeIds: ['shipping-method', 'category'],
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
        key: AVALARA_HASHED_CART_KEY,
        resourceTypeIds: ['order'],
        fieldDefinitions: [
          {
            name: 'avalaraHash',
          },
        ],
      },
    },
  ])('delete types', async ({ method, customType }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: {
          results: [
            { version: 1, fieldDefinitions: customType.fieldDefinitions },
          ],
        },
      })),
    };
    const apiRoot: any = {
      types: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };
    await method(apiRoot);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(2);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `resourceTypeIds contains any (${customType.resourceTypeIds
          .map((x) => `"${x}", `)
          .reduce((acc, curr) => acc + curr, '')
          .slice(0, -2)})`,
      },
    });
    expect(apiRoot.post).toBeCalled();
    expect(apiRoot.post).toBeCalledWith({
      body: {
        version: 1,
        actions: [
          {
            action: 'removeFieldDefinition',
            fieldName: customType.fieldDefinitions[0].name,
          },
        ],
      },
    });
  });
});
