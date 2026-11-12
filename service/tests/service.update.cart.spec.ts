import {
  describe,
  expect,
  test,
  jest,
  afterEach,
  beforeEach,
} from '@jest/globals';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { NextFunction, Request, Response } from 'express';
import { fullCart, emptyCart, cartRequest } from './carts';
import * as moduleAvaTax from 'avatax/lib/AvaTaxClient';
import { post } from '../src/controllers/service.controller';
import CustomError from '../src/errors/custom.error';
import * as moduleAvataxConfig from '../src/avalara/utils/avatax.config';
import { actions, expectAvaTaxReturn } from './avalara.response.validation';
import { config } from './test.data';
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
  beforeEach(() => {
    jest.spyOn(moduleAvataxConfig, 'avaTaxConfig').mockReturnValue(config);
    jest
      .spyOn(moduleAvaTax.default.prototype, 'createTransaction')
      .mockImplementation(async ({ model }: any) => {
        if (JSON.stringify(model).includes('Wrong St')) {
          throw new Error(
            'Invalid or missing State/Province. Address is incomplete or invalid.'
          );
        }
        return {
          code: '0',
          date: new Date().toISOString().substring(0, 10),
          status: 'Temporary',
          type: 'SalesOrder',
          currencyCode: 'USD',
          entityUseCode: 'B',
          customerCode: '0',
          totalAmount: 707,
          totalTax: 51.27,
          lines: [
            {
              itemCode: 'sku123',
              quantity: 2,
              lineAmount: 655,
              taxCode: 'PS081282',
              tax: 47.49,
              taxIncluded: false,
              details: [{ taxableAmount: 655, nonTaxableAmount: 0, rate: 0.0725 }],
            },
            {
              itemCode: 'Shipping',
              quantity: 1,
              lineAmount: 10,
              taxCode: 'PC030000',
              tax: 0.73,
              taxIncluded: false,
              details: [{ taxableAmount: 10, nonTaxableAmount: 0, rate: 0.0725 }],
            },
            {
              itemCode: '12345678909',
              tax: 3.05,
              details: [{ taxableAmount: 42, nonTaxableAmount: 0, rate: 0.0725 }],
            },
          ],
          addresses: [{ line1: '505 Beasley St' }, { line1: '2000 Main St' }],
        } as unknown as TransactionModel;
      });
  });
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
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(new CustomError(400, error));
    }
  );

  test('no Avalara merchant data was specified in the api root', async () => {
    const next = jest.fn() as NextFunction;
    apiRoot.execute = jest.fn(() => ({ body: { results: [] } }));
    await post(cartRequest(emptyCart), response, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
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
      expect(spyGetTax).toHaveBeenCalledTimes(0);
      expect(next).toHaveBeenCalledTimes(0);
      expect(response.status).toHaveBeenCalledWith(200);
      expect(response.json).toHaveBeenCalledTimes(1);
      expect(response.json).toHaveBeenCalledWith();
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
    expect(spyGetTax).toHaveBeenCalledTimes(1);
    expect(spyCreds).toHaveBeenCalledWith({
      username: process.env.AVALARA_USERNAME,
      password: process.env.AVALARA_PASSWORD,
      companyCode: process.env.AVALARA_COMPANY_CODE,
    } as any);
    const getTaxResult = (): Promise<TransactionModel> =>
      spyGetTax.mock.results[0].value as Promise<TransactionModel>;
    expectAvaTaxReturn(await getTaxResult());
    expect(next).toHaveBeenCalledTimes(0);
    expect(response.status).toHaveBeenCalledWith(200);
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(response.json).toHaveBeenCalledWith(actions);
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
    expect(SpyAvatax).toHaveBeenCalledWith(config);

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
    expect(spyGetTax).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveBeenCalledWith(
      new CustomError(
        400,
        'Invalid or missing State/Province. Address is incomplete or invalid.'
      )
    );
    expect(response.json).toHaveBeenCalledTimes(0);
  });
});
