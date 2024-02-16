import { describe, expect, test, jest, afterEach } from '@jest/globals';
import { post } from '../src/controllers/event.controller';
import { NextFunction, Request, Response } from 'express';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  messageOrderCreated,
  messageOrderStateChanged,
  orderRequest,
  shipTaxCodeBody,
} from './test.data';
import * as http from 'node:https';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import * as moduleVoid from '../src/avalara/requests/actions/void.transaction';
import CustomError, {
  CustomAvalaraError,
  avalaraErrorBody,
} from '../src/errors/custom.error';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import {
  expectCommitReturn,
  expectVoidReturn,
  expectRefundReturn,
} from './avatax.response.validation';

const apiRoot: any = {
  customObjects: jest.fn(() => apiRoot),
  shippingMethods: jest.fn(() => apiRoot),
  customers: jest.fn(() => apiRoot),
  productProjections: jest.fn(() => apiRoot),
  categories: jest.fn(() => apiRoot),
  orders: jest.fn(() => apiRoot),
  search: jest.fn(() => apiRoot),
  withId: jest.fn(() => apiRoot),
  withContainer: jest.fn(() => apiRoot),
  get: jest.fn(() => apiRoot),
  execute: jest.fn(() => ({ body: { results: [] } })),
};
jest.mock('../src/client/create.client', () => {
  return {
    createApiRoot: () => apiRoot,
  };
});

// create mock random order number
const getRandomNumber = (): string => {
  return `jest_test_${Math.random().toString(36).slice(2)}`;
};

const generateGoodRequest = (
  type: string,
  orderNumber: string,
  country: string
) => {
  let data = '';
  type === 'OrderCreated'
    ? (data = Buffer.from(
        JSON.stringify(messageOrderCreated(orderNumber, country))
      ).toString('base64'))
    : (data = Buffer.from(JSON.stringify(messageOrderStateChanged)).toString(
        'base64'
      ));
  return {
    body: {
      message: {
        data: data,
      },
    },
  } as unknown as Request;
};

const orderNumber = getRandomNumber();

const orderNumberConfigTest = getRandomNumber();
const commitRequestConfigTest = generateGoodRequest(
  'OrderCreated',
  orderNumberConfigTest,
  'US'
);
const voidRequestConfigTest = generateGoodRequest(
  'OrderStateChanged',
  orderNumberConfigTest,
  'US'
);
const refundRequestConfigTest = generateGoodRequest(
  'OrderStateChanged',
  orderNumberConfigTest,
  'US'
);

const expectedSuccessfulCreateOrderResponse = {
  createdAt: '2021-06-01T00:00:00.000Z',
  custom: {
    fields: { invoiceMessages: undefined },
    type: { id: 'invoiceMessagesType', key: 'invoiceMessages', typeId: 'type' },
  },
  customerId: '123',
  id: '123',
  lineItems: [
    {
      custom: {
        fields: { vatCode: '' },
        type: { id: 'vatCodeType', key: 'vatCode', typeId: 'type' },
      },
      name: { en: 'Test Product' },
      quantity: 2,
      taxRate: { includedInPrice: false },
      totalPrice: { centAmount: 12300, currencyCode: 'USD' },
      variant: { id: 1, sku: 'sku123' },
    },
  ],
  orderNumber: orderNumber,
  shippingAddress: {
    city: 'Irvine',
    country: 'US',
    postalCode: '92614',
    streetName: 'Main Street',
    streetNumber: '2000',
  },
  shippingInfo: {
    price: { centAmount: 123, currencyCode: 'USD' },
    shippingMethod: { id: '123' },
    shippingMethodName: 'Standard',
    taxRate: { includedInPrice: false },
  },
  totalPrice: { centAmount: 24600, currencyCode: 'USD' },
  version: 1,
};

const commitRequest = (country: string) =>
  generateGoodRequest('OrderCreated', orderNumber, country);
const voidRequest = (country: string) =>
  generateGoodRequest('OrderStateChanged', orderNumber, country);
const refundRequest = (country: string) =>
  generateGoodRequest('OrderStateChanged', orderNumber, country);

const badRequests = [
  {
    request: {} as unknown as Request,
    expectedError: 'Bad request: No Pub/Sub message was received',
  },
  {
    request: { body: {} } as unknown as Request,
    expectedError: 'Bad request: Wrong No Pub/Sub message format',
  },
  {
    request: { body: { message: {} } } as unknown as Request,
    expectedError: 'Bad request: No payload in the Pub/Sub message',
  },
];

const response = {
  status: jest.fn(() => response),
  send: jest.fn(),
} as unknown as Response;

const expectSuccessfulCall = (
  next: NextFunction,
  res: Response,
  times = 1,
  responseBody: any = undefined
) => {
  expect(next).toBeCalledTimes(0);
  expect(res.status).toBeCalledWith(200);
  expect(res.send).toBeCalledTimes(times);
  if (responseBody) {
    expect(res.send).toBeCalledWith(responseBody);
  } else {
    expect(res.send).toBeCalledWith();
  }
};

describe('test event controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test.each(badRequests)(
    'send bad requests',
    async ({ request, expectedError }) => {
      const next = jest.fn() as NextFunction;
      await post(request, response, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new CustomError(400, expectedError));
      expect(response.send).toBeCalledTimes(0);
    }
  );

  test.each([
    {
      request: commitRequestConfigTest,
      type: 'commit',
    },
    {
      request: voidRequestConfigTest,
      type: 'void',
    },
    {
      request: refundRequestConfigTest,
      type: 'refund',
    },
  ])(
    'valid requests are made with an expected AvaTax configuration',
    async ({ request, type }) => {
      type === 'void' || type === 'refund'
        ? (apiRoot.execute = jest
            .fn()
            .mockReturnValueOnce(avalaraMerchantDataBody(false))
            .mockReturnValueOnce(orderRequest(orderNumberConfigTest, 'US'))
            .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
            .mockReturnValueOnce(bulkProductCategoriesBody)
            .mockReturnValueOnce(
              bulkCategoryTaxCodeBody(['PS081282', 'PS080101'])
            )
            .mockReturnValueOnce(entityUseCodeBody('B')))
        : (apiRoot.execute = jest
            .fn()
            .mockReturnValueOnce(avalaraMerchantDataBody(false))
            .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
            .mockReturnValueOnce(bulkProductCategoriesBody)
            .mockReturnValueOnce(
              bulkCategoryTaxCodeBody(['PS081282', 'PS080101'])
            )
            .mockReturnValueOnce(entityUseCodeBody('B')));
      const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
      await post(request, response, jest.fn());
      expect(SpyAvatax).toHaveBeenCalledWith({
        appName: 'CommercetoolsbyMediaopt',
        appVersion: 'a0o5a000008TO2qAAG',
        customHttpAgent: expect.any(http.Agent),
        environment: process.env.AVALARA_ENV,
        logOptions: {
          logEnabled: true, // toggle logging on or off, by default its off.
          logLevel: 3, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
          logRequestAndResponseInfo: true,
        },
        machineName: 'v1',
        timeout: 5000,
      });
    }
  );

  test('create order', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(commitRequest('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getCommitResult = (): Promise<TransactionModel> =>
      spyCommit.mock.results[0].value as Promise<TransactionModel>;

    expect(spyCommit).toBeCalledTimes(1);
    expectCommitReturn(orderNumber, await getCommitResult());
    expectSuccessfulCall(
      next,
      response,
      1,
      expectedSuccessfulCreateOrderResponse
    );
  });

  test('cancel order, no lock transaction error is thrown', async () => {
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false))
      .mockReturnValueOnce(orderRequest(orderNumber, 'US'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const next = jest.fn() as NextFunction;
    const spyVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(voidRequest('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getVoidResult = (): Promise<TransactionModel> =>
      spyVoid.mock.results[0].value as Promise<TransactionModel>;
    expect(spyVoid).toBeCalledTimes(1);
    expectVoidReturn(orderNumber, await getVoidResult());
    expectSuccessfulCall(next, response);
  });

  test('cancel order, but a locked transaction  error is thrown', async () => {
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false))
      .mockReturnValueOnce(orderRequest(orderNumber, 'US'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const next = jest.fn() as NextFunction;
    const mockVoid = jest
      .spyOn(moduleVoid, 'voidTransaction')
      .mockImplementationOnce(async () => {
        throw new CustomAvalaraError('Locked transaction!', avalaraErrorBody);
      });
    const spyRefund = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(refundRequest('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getRefundResult = (): Promise<TransactionModel> =>
      spyRefund.mock.results[0].value as Promise<TransactionModel>;
    expect(spyRefund).toBeCalledTimes(1);
    expectRefundReturn(orderNumber, await getRefundResult());
    expectSuccessfulCall(next, response);
    mockVoid.mockRestore();
  });

  test('disable document recording, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(commitRequest('US'), response, next);
    expect(spyCommit).toBeCalledTimes(0);

    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true))
      .mockReturnValueOnce(orderRequest(orderNumber, 'US'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    await post(voidRequest('US'), response, next);
    expect(spyVoid).toBeCalledTimes(0);
    expectSuccessfulCall(next, response, 2);
  });

  test('create or cancel order with non-US/Canada shipping address, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyAvaTaxCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(commitRequest('DE'), response, next);
    expect(spyAvaTaxCommit).toBeCalledTimes(0);

    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true))
      .mockReturnValueOnce(orderRequest(orderNumber, 'DE'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyAvaTaxVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    await post(voidRequest('DE'), response, next);
    expect(spyAvaTaxVoid).toBeCalledTimes(0);
    expectSuccessfulCall(next, response, 2);
  });

  test('no Avalara credentials were specified, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce({ body: { results: [{}] } });
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(commitRequest('US'), response, next);
    expect(spyCommit).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(400, 'No Avalara merchant data is present.')
    );
    expect(response.send).toBeCalledTimes(0);
  });

  test('api Root throws an error', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest.fn(() => {
      throw new Error('apiRoot error');
    });
    await post(commitRequest('US'), response, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new CustomError(400, 'apiRoot error'));
    expect(response.send).toBeCalledTimes(0);
  });
});
