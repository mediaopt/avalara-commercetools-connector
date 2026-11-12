import {
  describe,
  expect,
  test,
  jest,
  afterEach,
  beforeEach,
} from '@jest/globals';
import { postCheckAddress } from '../src/controllers/check.address.controller';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import { NextFunction, Request, Response } from 'express';
import { avalaraMerchantDataBody } from './test.data';
import CustomError from '../src/errors/custom.error';
import { AddressResolutionModel } from 'avatax/lib/models/AddressResolutionModel';
import * as moduleAvataxConfig from '../src/avalara/utils/avatax.config';
import { config } from './test.data';

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
];

const validRequests = (isValidAddress: boolean) => {
  return [
    {
      body: {
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
  beforeEach(() => {
    jest.spyOn(moduleAvataxConfig, 'avaTaxConfig').mockReturnValue(config);
    jest
      .spyOn(moduleAvaTax.default.prototype, 'resolveAddress')
      .mockImplementation(async (address) => {
        if (process.env.AVALARA_USERNAME === 'test') {
          throw new Error('BadRequest');
        }
        const invalid = address.line1?.startsWith('200043');
        return {
          validatedAddresses: invalid ? [] : [address],
          messages: invalid
            ? [{ severity: 'Error', summary: 'Invalid address' }]
            : [],
        } as AddressResolutionModel;
      });
  });
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test.each(badRequests)(
    'bad requests throw an error',
    async ({ request, errorMessage }) => {
      const next = jest.fn() as NextFunction;
      await postCheckAddress(request, response, next);
      expect(apiRoot.execute).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(new CustomError(400, errorMessage));
    }
  );

  test.each(validRequests(true))(
    'valid requests are made with an expected AvaTax configuration',
    async (request) => {
      const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
      await postCheckAddress(request, response, jest.fn());
      if (!request.body?.creds || !request.body?.env) {
        expect(apiRoot.execute).toHaveBeenCalledTimes(1);
      } else {
        expect(apiRoot.execute).toHaveBeenCalledTimes(0);
      }
      expect(SpyAvatax).toHaveBeenCalledWith(config);
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
      expect(spyValidate).toHaveBeenCalledWith(request.body.address);
      expect(spyCreds).toHaveBeenCalledWith({
        username: process.env.AVALARA_USERNAME,
        password: process.env.AVALARA_PASSWORD,
      });
      const getValidateResult = (): Promise<AddressResolutionModel> =>
        spyValidate.mock.results[0].value as Promise<AddressResolutionModel>;
      const validation = await getValidateResult();
      expect(
        validation?.messages?.find((message) => message.severity === 'Error')
      ).toBeUndefined();
      expect(response.json).toHaveBeenCalledWith({
        valid: true,
        address: validation?.validatedAddresses,
      });
      expect(response.status).toHaveBeenCalledWith(200);
      expect(next).toHaveBeenCalledTimes(0);
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
      expect(spyValidate).toHaveBeenCalledWith(request.body.address);
      expect(spyCreds).toHaveBeenCalledWith({
        username: process.env.AVALARA_USERNAME,
        password: process.env.AVALARA_PASSWORD,
      });
      const getValidateResult = (): Promise<AddressResolutionModel> =>
        spyValidate.mock.results[0].value as Promise<AddressResolutionModel>;
      const validation = await getValidateResult();
      expect(
        validation?.messages?.find((message) => message.severity === 'Error')
      ).toBeDefined();
      expect(response.json).toHaveBeenCalledWith({
        valid: false,
        errorMessages: validation?.messages?.filter(
          (message) => message.severity === 'Error'
        ),
      });
      expect(response.status).toHaveBeenCalledWith(200);
      expect(next).toHaveBeenCalledTimes(0);
    }
  );
  test('invalid credentials throw an error', async () => {
    process.env.AVALARA_USERNAME = 'test';
    process.env.AVALARA_PASSWORD = 'test';
    const next = jest.fn() as NextFunction;
    await postCheckAddress(
      {
        body: {
          address: {
            line1: '2000 Main Street',
            city: 'Irvine',
            region: 'CA',
            country: 'US',
            postalCode: '92614',
          },
        },
      } as Request,
      response,
      next
    );
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(new CustomError(401, 'BadRequest'));
  });
});
