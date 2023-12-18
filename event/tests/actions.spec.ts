import { expect, test, jest, describe } from '@jest/globals';
import {
  ORDER_SUBSCRIPTION_KEY,
  createOrderSubscription,
  deleteOrderSubscription,
} from '../src/connector/actions';

describe('test connector actions', () => {
  test('create order subscription', async () => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{ version: 1 }] } })),
    };
    const apiRoot: any = {
      subscriptions: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };

    const topicName = 'test-topic';
    const projectId = 'test-project-id';

    await createOrderSubscription(apiRoot, topicName, projectId);

    expect(apiRoot.subscriptions).toBeCalledTimes(3);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRoot.post).toBeCalledTimes(1);
    expect(apiRequest.execute).toBeCalledTimes(3);

    expect(apiRoot.get).toBeCalledWith({
      queryArgs: {
        where: `key = "${ORDER_SUBSCRIPTION_KEY}"`,
      },
    });

    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });

    expect(apiRoot.post).toBeCalledWith({
      body: {
        key: ORDER_SUBSCRIPTION_KEY,
        destination: {
          type: 'GoogleCloudPubSub',
          topic: topicName,
          projectId,
        },
        messages: [
          {
            resourceTypeId: 'order',
            types: ['OrderCreated', 'OrderStateChanged'],
          },
        ],
      },
    });
  });

  test('delete order subscription', async () => {
    const apiRequest: any = {
      execute: jest.fn(() => ({ body: { results: [{ version: 1 }] } })),
    };
    const apiRoot: any = {
      subscriptions: jest.fn(() => apiRoot),
      withKey: jest.fn(() => apiRoot),
      delete: jest.fn(() => apiRequest),
      get: jest.fn(() => apiRequest),
      post: jest.fn(() => apiRequest),
    };

    await deleteOrderSubscription(apiRoot);

    expect(apiRoot.subscriptions).toBeCalledTimes(2);
    expect(apiRoot.get).toBeCalledTimes(1);
    expect(apiRoot.delete).toBeCalledTimes(1);
    expect(apiRoot.post).toBeCalledTimes(0);
    expect(apiRequest.execute).toBeCalledTimes(2);

    expect(apiRoot.delete).toBeCalledWith({
      queryArgs: {
        version: 1,
      },
    });
  });
});
