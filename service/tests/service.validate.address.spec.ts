import { describe, expect, test, jest, afterEach } from '@jest/globals';
import { postCheckAddress } from '../src/controllers/check.address.controller';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import * as http from 'node:https';
import { NextFunction, Request, Response } from 'express';
import { avalaraMerchantDataBody } from './test.data';
import CustomError from '../src/errors/custom.error';
import { AddressResolutionModel } from 'avatax/lib/models/AddressResolutionModel';

const apiRoot: any = {
  customObjects: jest.fn(() => apiRoot),
  withContainer: jest.fn(() => apiRoot),
  get: jest.fn(() => apiRoot),
  execute: jest.fn(() => avalaraMerchantDataBody),
};

jest.mock('../src/client/create.client', () => {
  return {
    createApiRoot: () => apiRoot,
  };
});

const response = {
  json: jest.fn(),
  status: jest.fn().mockReturnThis(),
} as unknown as Response;

const badRequests = [
  { request: {} as Request, errorMessage: 'Bad request: Missing address' },
  {
    request: { body: {} } as Request,
    errorMessage: 'Bad request: Missing address',
  },
  {
    request: { body: { address: {} } } as Request,
    errorMessage: 'Bad request: Missing address',
  },
  {
    request: {
      body: {
        creds: {},
        env: 'sandbox',
        address: {
          line1: '2000 Main Street',
          city: 'Irvine',
          region: 'CA',
          country: 'US',
          postalCode: '92614',
        },
      },
    } as Request,
    errorMessage: 'Authentication failed.',
  },
];

const validRequests = (isValidAddress: boolean) => {
  return [
    {
      body: {
        env: process.env.AVALARA_ENV,
        creds: {
          username: process.env.AVALARA_USERNAME,
          password: process.env.AVALARA_PASSWORD,
        },
        address: {
          line1: `${isValidAddress ? '2000' : '200043'} Main Street`,
          city: 'Irvine',
          region: 'CA',
          country: 'US',
          postalCode: '92614',
        },
        logging: {
          enabled: true,
          level: '2',
        },
      },
    } as Request,
    {
      body: {
        address: {
          line1: `${isValidAddress ? '2000' : '200043'} Main Street`,
          city: 'Irvine',
          region: 'CA',
          country: 'US',
          postalCode: '92614',
        },
      },
    } as Request,
  ];
};

describe('test check address controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test.each(badRequests)(
    'bad requests throw an error',
    async ({ request, errorMessage }) => {
      const next = jest.fn() as NextFunction;
      await postCheckAddress(request, response, next);
      expect(apiRoot.execute).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new CustomError(400, errorMessage));
    }
  );

  test.each(validRequests(true))(
    'valid requests are made with an expected AvaTax configuration',
    async (request) => {
      const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
      await postCheckAddress(request, response, jest.fn());
      if (!request.body?.creds || !request.body?.env) {
        expect(apiRoot.execute).toBeCalledTimes(1);
      } else {
        expect(apiRoot.execute).toBeCalledTimes(0);
      }
      expect(SpyAvatax).toHaveBeenCalledWith({
        appName: 'CommercetoolsbyMediaopt',
        appVersion: 'a0o5a000008TO2qAAG',
        customHttpAgent: expect.any(http.Agent),
        environment: process.env.AVALARA_ENV,
        logOptions: {
          logEnabled: true, // toggle logging on or off, by default its off.
          logLevel: 2, // logLevel that will be used, Options are LogLevel.Error (0), LogLevel.Warn (1), LogLevel.Info (2), LogLevel.Debug (3)
          logRequestAndResponseInfo: true,
        },
        machineName: 'v1',
        timeout: 5000,
      });
    }
  );

  test.each(validRequests(true))(
    'valid address is resolved',
    async (request) => {
      const next = jest.fn();
      const spyValidate = jest.spyOn(
        moduleAvaTax.default.prototype,
        'resolveAddress'
      );
      const spyCreds = jest.spyOn(
        moduleAvaTax.default.prototype,
        'withSecurity'
      );
      await postCheckAddress(request, response, next);
      expect(spyValidate).toBeCalledWith(request.body.address);
      expect(spyCreds).toBeCalledWith({
        username: process.env.AVALARA_USERNAME,
        password: process.env.AVALARA_PASSWORD,
      });
      const getValidateResult = (): Promise<AddressResolutionModel> =>
        spyValidate.mock.results[0].value as Promise<AddressResolutionModel>;
      const validation = await getValidateResult();
      expect(
        validation?.messages?.find((message) => message.severity === 'Error')
      ).toBeUndefined();
      expect(response.json).toBeCalledWith({
        valid: true,
        address: validation?.validatedAddresses,
      });
      expect(response.status).toBeCalledWith(200);
      expect(next).toBeCalledTimes(0);
    }
  );

  test.each(validRequests(false))(
    'invalid address is not resolved',
    async (request) => {
      const next = jest.fn();
      const spyValidate = jest.spyOn(
        moduleAvaTax.default.prototype,
        'resolveAddress'
      );
      const spyCreds = jest.spyOn(
        moduleAvaTax.default.prototype,
        'withSecurity'
      );
      await postCheckAddress(request, response, next);
      expect(spyValidate).toBeCalledWith(request.body.address);
      expect(spyCreds).toBeCalledWith({
        username: process.env.AVALARA_USERNAME,
        password: process.env.AVALARA_PASSWORD,
      });
      const getValidateResult = (): Promise<AddressResolutionModel> =>
        spyValidate.mock.results[0].value as Promise<AddressResolutionModel>;
      const validation = await getValidateResult();
      expect(
        validation?.messages?.find((message) => message.severity === 'Error')
      ).toBeDefined();
      expect(response.json).toBeCalledWith({
        valid: false,
        errorMessages: validation?.messages?.filter(
          (message) => message.severity === 'Error'
        ),
      });
      expect(response.status).toBeCalledWith(200);
      expect(next).toBeCalledTimes(0);
    }
  );
});
