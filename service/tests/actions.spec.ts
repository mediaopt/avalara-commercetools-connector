import { describe, expect, test, jest } from '@jest/globals';
import {
  createAvalaraEntityUseCodeFields,
  createAvalaraTaxCodeFields,
  createCartUpdateExtension,
  deleteAvalaraEntityUseCodeFields,
  deleteAvalaraTaxCodeFields,
  deleteCartUpdateExtension,
} from '../src/connector/actions';

describe('Testing actions', () => {
  test.each([
    {
      method: createCartUpdateExtension,
    },
  ])('$method', async ({ method }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{}] } })),
    };
    const apiRoot: any = {
      extensions: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };
    await method(apiRoot, 'https://lorem.ipsum');
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRoot.post).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(3);
  });

  test('delete extension', async () => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{}] } })),
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
  });

  test.each([
    {
      method: createAvalaraEntityUseCodeFields,
      expectedLength: 1,
    },
    {
      method: createAvalaraTaxCodeFields,
      expectedLength: 1,
    },
  ])('$method', async ({ method, expectedLength }) => {
    const apiRequest: any = {
      execute: jest.fn(() => ({
        body: { results: [{ fieldDefinitions: [] }] },
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
    expect(apiRoot.post.mock.calls[0][0].body.actions).toHaveLength(
      expectedLength
    );
  });
});

test.each([
  {
    method: deleteAvalaraEntityUseCodeFields,
  },
  {
    method: deleteAvalaraTaxCodeFields,
  },
])('delete types', async ({ method }) => {
  const apiRequest: any = {
    execute: jest.fn(() => ({ body: { results: [{}] } })),
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
});
