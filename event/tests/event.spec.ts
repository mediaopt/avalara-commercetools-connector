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
  messageOrderStateTransition,
  messageReturnShipmentStateChanged,
  orderRequest,
  shipTaxCodeBody,
} from './test.data';
import * as http from 'node:https';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import * as moduleVoid from '../src/avalara/requests/actions/void.or.refund.transaction';
import * as moduleAdjust from '../src/avalara/requests/actions/adjust.or.refund.transaction.lines';
import CustomError, {
  CustomAvalaraError,
  avalaraErrorBody,
} from '../src/errors/custom.error';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import {
  expectCommitReturn,
  expectVoidReturn,
  expectRefundReturn,
  expectAdjustedRefundReturn,
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
  country: string,
  state_id?: string
) => {
  let data: string;
  switch (type) {
    case 'OrderCreated':
      data = Buffer.from(
        JSON.stringify(messageOrderCreated(orderNumber, country))
      ).toString('base64');
      break;
    case 'OrderStateChanged':
      data = Buffer.from(JSON.stringify(messageOrderStateChanged)).toString(
        'base64'
      );
      break;
    case 'OrderStateTransition':
      data = Buffer.from(
        JSON.stringify(messageOrderStateTransition(state_id as string))
      ).toString('base64');
      break;
    case 'OrderReturnShipmentStateChanged':
      data = Buffer.from(
        JSON.stringify(messageReturnShipmentStateChanged)
      ).toString('base64');
      break;
    default:
      data = Buffer.from(
        JSON.stringify(messageOrderCreated(orderNumber, country))
      ).toString('base64');
  }
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

const commitRequest = (country: string) =>
  generateGoodRequest('OrderCreated', orderNumber, country);
const voidRequest = (country: string) =>
  generateGoodRequest('OrderStateChanged', orderNumber, country);
const refundRequest = (country: string) =>
  generateGoodRequest('OrderStateChanged', orderNumber, country);

const anotherOrderNumber = getRandomNumber();

const commitRequestWithCustomOrderState = (country: string) =>
  generateGoodRequest(
    'OrderStateTransition',
    anotherOrderNumber,
    country,
    '123'
  );

const refundTransactionLinesRequest = (country: string) =>
  generateGoodRequest(
    'OrderReturnShipmentStateChanged',
    anotherOrderNumber,
    country
  );

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

const expectSuccessfulCall = (next: NextFunction, res: Response, times = 1) => {
  const next_times = times === 2 ? 2 : 0;
  expect(next).toBeCalledTimes(next_times);
  expect(res.status).toBeCalledWith(200);
  expect(res.send).toBeCalledTimes(times);
  expect(res.send).toBeCalledWith();
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
            .mockReturnValueOnce(avalaraMerchantDataBody(false, true, true))
            .mockReturnValueOnce(orderRequest(orderNumberConfigTest, 'US'))
            .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
            .mockReturnValueOnce(bulkProductCategoriesBody)
            .mockReturnValueOnce(
              bulkCategoryTaxCodeBody(['PS081282', 'PS080101'])
            )
            .mockReturnValueOnce(entityUseCodeBody('B')))
        : (apiRoot.execute = jest
            .fn()
            .mockReturnValueOnce(avalaraMerchantDataBody(false, true, true))
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
        timeout: 10000,
      });
    }
  );

  test('create order with automatic commit', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false, true, true))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'));
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );
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
    expectSuccessfulCall(next, response);
  });

  test('create order with a prescribed order states', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false, false))
      .mockReturnValueOnce(orderRequest(anotherOrderNumber, 'US'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'));
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );
    await post(commitRequestWithCustomOrderState('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getCommitResult = (): Promise<TransactionModel> =>
      spyCommit.mock.results[0].value as Promise<TransactionModel>;

    expect(spyCommit).toBeCalledTimes(1);
    expectCommitReturn(anotherOrderNumber, await getCommitResult());
    expectSuccessfulCall(next, response);
  });

  test('remove lines from a transaction for an unlocked transaction', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false, false, false))
      .mockReturnValueOnce(orderRequest(anotherOrderNumber, 'US'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'));
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );
    await post(refundTransactionLinesRequest('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getRefundResult = (): Promise<TransactionModel> =>
      spyCommit.mock.results[0].value as Promise<TransactionModel>;

    expect(spyCommit).toBeCalledTimes(1);
    expectAdjustedRefundReturn(
      anotherOrderNumber,
      await getRefundResult(),
      false
    );
    expectSuccessfulCall(next, response);
  });

  test('refund lines from a transaction for a locked transaction', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false, false, false))
      .mockReturnValueOnce(orderRequest(anotherOrderNumber, 'US'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );

    const mockAdjust = jest.spyOn(moduleAdjust, 'adjustTransactionLines');

    mockAdjust.mockImplementation(async () => {
      throw new CustomAvalaraError('Locked transaction!', avalaraErrorBody);
    });

    await post(refundTransactionLinesRequest('US'), response, next);
    expect(spyCreds).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getRefundResult = (): Promise<TransactionModel> =>
      spyCommit.mock.results[0].value as Promise<TransactionModel>;

    expect(spyCommit).toBeCalledTimes(1);
    expectAdjustedRefundReturn(
      anotherOrderNumber,
      await getRefundResult(),
      true
    );
    expectSuccessfulCall(next, response);
    mockAdjust.mockRestore();
  });

  test('cancel order, no lock transaction error is thrown', async () => {
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(false, true, true))
      .mockReturnValueOnce(orderRequest(orderNumber, 'US'))
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
      .mockReturnValueOnce(avalaraMerchantDataBody(false, true, true))
      .mockReturnValueOnce(orderRequest(orderNumber, 'US'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const next = jest.fn() as NextFunction;
    const mockVoid = jest.spyOn(moduleVoid, 'voidTransaction');

    mockVoid.mockImplementation(async () => {
      throw new CustomAvalaraError('Locked transaction!', avalaraErrorBody);
    });
    const spyRefund = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
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
      .mockReturnValueOnce(avalaraMerchantDataBody(true, true, true))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );
    await post(commitRequest('US'), response, next);
    expect(spyCommit).toBeCalledTimes(0);

    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true, true, true))
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
      .mockReturnValueOnce(avalaraMerchantDataBody(true, true, true))
      .mockReturnValueOnce(shipTaxCodeBody('PC030000'))
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody(['PS081282', 'PS080101']))
      .mockReturnValueOnce(entityUseCodeBody('B'));
    const spyAvaTaxCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createOrAdjustTransaction'
    );
    await post(commitRequest('DE'), response, next);
    expect(spyAvaTaxCommit).toBeCalledTimes(0);

    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody(true, true, true))
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
      'createOrAdjustTransaction'
    );
    await post(commitRequest('US'), response, next);
    expect(spyCommit).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(400, 'No Avalara merchant data is present.')
    );
    expect(response.send).toBeCalledTimes(0);
  });
});
