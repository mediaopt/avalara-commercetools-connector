import { describe, expect, test, jest, afterEach } from '@jest/globals';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { NextFunction, Request, Response } from 'express';
import { fullCart, emptyCart, cartRequest } from './carts';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import { post } from '../src/controllers/service.controller';
import * as http from 'node:https';
import CustomError from '../src/errors/custom.error';
import { actions, expectAvaTaxReturn } from './avalara.response.validation';
import {
  avalaraMerchantDataBody,
  bulkCategoryTaxCodeBody,
  bulkProductCategoriesBody,
  entityUseCodeBody,
  shipTaxCodeBody,
} from './test.data';

const apiRoot: any = {
  customObjects: jest.fn(() => apiRoot),
  shippingMethods: jest.fn(() => apiRoot),
  customers: jest.fn(() => apiRoot),
  productProjections: jest.fn(() => apiRoot),
  categories: jest.fn(() => apiRoot),
  search: jest.fn(() => apiRoot),
  withId: jest.fn(() => apiRoot),
  withContainer: jest.fn(() => apiRoot),
  get: jest.fn(() => apiRoot),
  execute: jest.fn(),
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

const serviceThrowCases = [
  {
    request: {
      body: {
        action: 'invalidAction',
        resource: {
          typeId: 'cart',
          obj: {
            currency: 'USD',
          },
        },
      },
    } as Request,
    error: `Internal Server Error - Resource not recognized. Allowed values are 'Create' or 'Update'.`,
  },
  {
    request: {
      body: {
        action: 'Create',
        resource: {
          typeId: 'invalidType',
          obj: {
            currency: 'USD',
          },
        },
      },
    } as Request,
    error: `Internal Server Error - Resource not recognized. Allowed values are 'cart'.`,
  },
  {
    request: {
      body: {
        action: '',
        resource: {},
      },
    } as Request,
    error: 'Bad request - Missing body parameters.',
  },
];

describe('test service/cart controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  test.each(serviceThrowCases)(
    'bad requests throw an error',
    async ({ request, error }) => {
      const next = jest.fn() as NextFunction;
      apiRoot.execute = jest.fn(() => ({ body: { results: [] } }));
      await post(request, response, next);
      expect(next).toBeCalledTimes(1);
      expect(next).toBeCalledWith(new CustomError(400, error));
    }
  );

  test('no Avalara merchant data was specified in the api root', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest.fn(() => ({ body: { results: [] } }));
    await post(cartRequest(emptyCart), response, next);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(400, 'No Avalara merchant configuration found.')
    );
  });

  test.each([
    cartRequest(
      fullCart({
        country: 'DE',
        city: 'Berlin',
        streetName: 'Main Street',
        streetNumber: '2000',
        postalCode: '92614',
      })
    ),
    cartRequest(
      fullCart(
        {
          country: 'US',
          city: 'Irvine',
          streetName: 'Main Street',
          streetNumber: '2000',
          postalCode: '92614',
        },
        '9952a1641782875e8e868a11c421ae0b'
      )
    ),
  ])(
    'make valid cart request with non-US-Canada address/same hash data, no tax calculation will be made',
    async (request) => {
      const next = jest.fn() as NextFunction;
      apiRoot.execute = jest
        .fn()
        .mockReturnValueOnce(avalaraMerchantDataBody)
        .mockReturnValueOnce(shipTaxCodeBody)
        .mockReturnValueOnce(bulkProductCategoriesBody)
        .mockReturnValueOnce(bulkCategoryTaxCodeBody)
        .mockReturnValueOnce(entityUseCodeBody);
      const spyGetTax = jest.spyOn(
        moduleAvaTax.default.prototype,
        'createTransaction'
      );
      await post(request, response, next);
      expect(spyGetTax).toBeCalledTimes(0);
      expect(next).toBeCalledTimes(0);
      expect(response.status).toBeCalledWith(200);
      expect(response.json).toBeCalledTimes(1);
      expect(response.json).toBeCalledWith();
    }
  );

  test('make valid cart request with sufficient data and new cart hash, tax calculation will be made', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody)
      .mockReturnValueOnce(shipTaxCodeBody)
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody)
      .mockReturnValueOnce(entityUseCodeBody);
    const spyGetTax = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    const spyCreds = jest.spyOn(moduleAvaTax.default.prototype, 'withSecurity');
    await post(
      cartRequest(
        fullCart({
          country: 'US',
          city: 'Irvine',
          streetName: 'Main St',
          streetNumber: '2000',
          postalCode: '92614',
        })
      ),
      response,
      next
    );
    expect(spyGetTax).toBeCalledTimes(1);
    expect(spyCreds).toBeCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    });
    const getTaxResult = (): Promise<TransactionModel> =>
      spyGetTax.mock.results[0].value as Promise<TransactionModel>;
    expectAvaTaxReturn(await getTaxResult());
    expect(next).toBeCalledTimes(0);
    expect(response.status).toBeCalledWith(200);
    expect(response.json).toBeCalledTimes(1);
    expect(response.json).toBeCalledWith(actions);
  });

  test('valid cart request is made with an expected AvaTax configuration', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody)
      .mockReturnValueOnce(shipTaxCodeBody)
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody)
      .mockReturnValueOnce(entityUseCodeBody);
    const SpyAvatax = jest.spyOn(moduleAvaTax, 'default');
    await post(
      cartRequest(
        fullCart({
          country: 'US',
          city: 'Irvine',
          streetName: 'Main St',
          streetNumber: '2000',
          postalCode: '92614',
        })
      ),
      response,
      next
    );
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
      timeout: 10000,
    });

    SpyAvatax.mockRestore();
  });

  test('make valid cart request with sufficient data and wrong address, avalara throws', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest
      .fn()
      .mockReturnValueOnce(avalaraMerchantDataBody)
      .mockReturnValueOnce(shipTaxCodeBody)
      .mockReturnValueOnce(bulkProductCategoriesBody)
      .mockReturnValueOnce(bulkCategoryTaxCodeBody)
      .mockReturnValueOnce(entityUseCodeBody);
    const spyGetTax = jest.spyOn(
      moduleAvaTax.default.prototype,
      'createTransaction'
    );
    await post(
      cartRequest(
        fullCart({
          country: 'US',
          city: 'City',
          streetName: 'Wrong St',
          streetNumber: '32423',
          postalCode: '11111',
        })
      ),
      response,
      next
    );
    expect(spyGetTax).toBeCalledTimes(1);
    expect(next).toBeCalledTimes(1);
    expect(next).toBeCalledWith(
      new CustomError(
        400,
        'Invalid or missing State/Province. Address is incomplete or invalid.'
      )
    );
    expect(response.json).toBeCalledTimes(0);
  });
});
