import { describe, expect, test, jest, afterEach } from '@jest/globals';
import { post } from '../src/controllers/event.controller';
import { NextFunction, Request, Response } from 'express';
import { messageOrderCreated, messageOrderStateChanged } from './test.data';
import * as http from 'node:https';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import * as moduleCommit from '../src/avalara/requests/actions/commit.transaction';
import * as moduleVoid from '../src/avalara/requests/actions/void.transaction';
import CustomError from '../src/errors/custom.error';
import { apiRootCommit, apiRootRefund, apiRootVoid } from './event.api.root';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import {
  expectCommitReturn,
  expectVoidReturn,
  expectRefundReturn,
} from './avatax.response.validation';

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

const expectSuccessfulCall = (next: NextFunction, res: Response, times = 1) => {
  expect(next).toBeCalledTimes(0);
  expect(res.status).toBeCalledWith(200);
  expect(res.send).toBeCalledTimes(times);
  expect(res.send).toBeCalledWith();
};

describe('test event controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test.each(badRequests)(
    'send bad requests',
    async ({ request, expectedError }) => {
      const next = jest.fn() as NextFunction;
      await post(request, response, next, {} as any);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new CustomError(400, expectedError));
      expect(response.send).toBeCalledTimes(0);
    }
  );

  test.each([
    {
      request: commitRequestConfigTest,
      apiRoot: apiRootCommit(orderNumberConfigTest, false, 'US'),
    },
    {
      request: voidRequestConfigTest,
      apiRoot: apiRootVoid(orderNumberConfigTest, false, 'US'),
    },
    {
      request: refundRequestConfigTest,
      apiRoot: apiRootRefund(orderNumberConfigTest, false, 'US'),
    },
  ])(
    'valid requests are made with an expected AvaTax configuration',
    async ({ request, apiRoot }) => {
      const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
      await post(request, response, jest.fn(), apiRoot);
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

      SpyAvatax.mockRestore();
    }
  );

  test('create order', async () => {
    const next = jest.fn() as NextFunction;
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(
      commitRequest('US'),
      response,
      next,
      apiRootCommit(orderNumber, false, 'US')
    );
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

  test('cancel order, no lock transaction error is thrown', async () => {
    const next = jest.fn() as NextFunction;
    const spyVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(
      voidRequest('US'),
      response,
      next,
      apiRootVoid(orderNumber, false, 'US')
    );
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
    const next = jest.fn() as NextFunction;
    const spyRefund = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(
      refundRequest('US'),
      response,
      next,
      apiRootRefund(orderNumber, false, 'US')
    );
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
  });

  test('disable document recording, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(
      commitRequest('US'),
      response,
      next,
      apiRootCommit(orderNumber, true, 'US')
    );
    expect(spyCommit).toBeCalledTimes(0);

    const spyVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    await post(
      voidRequest('US'),
      response,
      next,
      apiRootVoid(orderNumber, true, 'US')
    );
    expect(spyVoid).toBeCalledTimes(0);
    expectSuccessfulCall(next, response, 2);
  });

  test('create or cancel order with non-US/Canada shipping address, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    const spyCommit = jest.spyOn(moduleCommit, 'commitTransaction');
    const spyAvaTaxCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(
      commitRequest('DE'),
      response,
      next,
      apiRootCommit(orderNumber, false, 'DE')
    );
    expect(spyAvaTaxCommit).toBeCalledTimes(0);
    const getCommitResult = (): Promise<boolean> =>
      spyCommit.mock.results[0].value as Promise<boolean>;
    expect(spyCommit).toBeCalledTimes(1);
    expect(await getCommitResult()).toEqual(false);

    const spyVoid = jest.spyOn(moduleVoid, 'voidTransaction');
    const spyAvaTaxVoid = jest.spyOn(
      moduleAvaTax.default.prototype,
      'voidTransaction'
    );
    await post(
      voidRequest('DE'),
      response,
      next,
      apiRootVoid(orderNumber, false, 'DE')
    );
    expect(spyAvaTaxVoid).toBeCalledTimes(0);
    const getVoidResult = (): Promise<boolean> =>
      spyVoid.mock.results[0].value as Promise<boolean>;
    expect(spyVoid).toBeCalledTimes(1);
    expect(await getVoidResult()).toEqual(false);
    expectSuccessfulCall(next, response, 2);
  });

  test('no Avalara credentials were specified, no calls are made to Avalara', async () => {
    const next = jest.fn() as NextFunction;
    const noAvalaraDataRoot: any = {
      customObjects: jest.fn(() => noAvalaraDataRoot),
      withContainer: jest.fn(() => noAvalaraDataRoot),
      get: jest.fn(() => noAvalaraDataRoot),
      execute: jest.fn(() => ({ body: { results: [{}] } })),
    };
    const spyCommit = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(commitRequest('US'), response, next, noAvalaraDataRoot);
    expect(spyCommit).toBeCalledTimes(0);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(400, 'No Avalara merchant data is present.')
    );
    expect(response.send).toBeCalledTimes(0);
  });

  test('api Root throws an error', async () => {
    const next = jest.fn() as NextFunction;
    const badRoot: any = {
      customObjects: jest.fn(() => badRoot),
      withContainer: jest.fn(() => badRoot),
      get: jest.fn(() => badRoot),
      execute: jest.fn(() => {
        throw new Error('apiRoot error');
      }),
    };
    await post(commitRequest('US'), response, next, badRoot);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(new CustomError(400, 'apiRoot error'));
    expect(response.send).toBeCalledTimes(0);
  });
});
