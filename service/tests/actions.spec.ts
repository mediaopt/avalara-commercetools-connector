import { describe, expect, test, jest } from '@jest/globals';
import {
  CART_UPDATE_EXTENSION_KEY,
  createAvalaraEntityUseCodeFields,
  createAvalaraTaxCodeFields,
  createCartUpdateExtension,
  createAvalaraHashedCartField,
  deleteAvalaraEntityUseCodeFields,
  deleteAvalaraTaxCodeFields,
  deleteCartUpdateExtension,
  deleteAvalaraHashedCartField,
  AVALARA_ENTITY_USE_CODES_KEY,
  AVALARA_HASHED_CART_KEY,
  AVALARA_TAX_CODES_KEY,
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
    },
    {
      method: createAvalaraTaxCodeFields,
      customType: {
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
      },
    },
  ])('$method', async ({ method, customType }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: { results: [] },
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
        where: `key = "${customType?.key}"`,
      },
    });

    expect(apiRoot.post).toBeCalledWith({
      body: customType,
    });
  });

  test.each([
    {
      method: deleteAvalaraEntityUseCodeFields,
      key: AVALARA_ENTITY_USE_CODES_KEY,
    },
    {
      method: deleteAvalaraTaxCodeFields,
      key: AVALARA_TAX_CODES_KEY,
    },
    {
      method: deleteAvalaraHashedCartField,
      key: AVALARA_HASHED_CART_KEY,
    },
  ])('delete types', async ({ method, key }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{ version: 1 }] } })),
    };
    const apiRoot: any = {
      types: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
    };
    await method(apiRoot);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(2);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `key = "${key}"`,
      },
    });

    expect(apiRoot.withKey).toBeCalledWith({ key: key });

    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });
  });
});
