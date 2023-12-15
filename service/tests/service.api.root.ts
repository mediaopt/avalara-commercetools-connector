import { jest } from '@jest/globals';
import { AvataxMerchantConfig } from '../src/interfaces/avatax.config.interface';

export const avalaraMerchantDataBody = {
  body: {
    results: [
      {
        key: 'settings',
        value: {
          accountNumber: process.env.AVALARA_USERNAME,
          licenseKey: process.env.AVALARA_PASSWORD,
          companyCode: process.env.AVALARA_COMPANY_CODE,
          env: false,
          logLevel: '2',
          addressValidation: true,
          disableDocRec: false,
          taxCalculation: 'USCA',
          enableLogging: true,
          line1: '505 Beasley St',
          line2: '',
          line3: '',
          postalCode: '39201-5802',
          city: 'Jackson',
          region: 'MS',
          country: 'US',
        } as AvataxMerchantConfig,
      },
    ],
  },
};

export const shipTaxCodeBody = {
  body: {
    custom: {
      fields: {
        avalaraTaxCode: 'PC030000',
      },
    },
  },
};

export const entityUseCodeBody = {
  body: {
    custom: {
      fields: {
        avalaraEntityUseCode: 'B',
      },
    },
  },
};

export const bulkCategoryTaxCodeBody = {
  body: {
    results: [
      {
        id: '123',
        custom: {
          fields: {
            avalaraTaxCode: 'PS081282',
          },
        },
      },
      {
        id: '456',
        custom: {
          fields: {
            avalaraTaxCode: 'PS080101',
          },
        },
      },
    ],
  },
};

export const bulkProductCategoriesBody = {
  body: {
    results: [
      {
        masterVariant: {
          sku: 'sku123',
        },
        categories: [
          {
            id: '123',
          },
        ],
      },
      {
        variants: [
          {
            sku: 'sku456',
          },
        ],
        categories: [
          {
            id: '456',
          },
        ],
      },
    ],
  },
};

export const buildRequest: any = (requestType: string) => {
  switch (requestType) {
    case 'getData':
      return {
        execute: jest.fn(() => avalaraMerchantDataBody),
      };
    case 'getShipTaxCode':
      return {
        execute: jest.fn(() => shipTaxCodeBody),
      };
    case 'getCustomerEntityUseCode':
      return {
        execute: jest.fn(() => entityUseCodeBody),
      };
    case 'getBulkCategoryTaxCode':
      return {
        execute: jest.fn(() => bulkCategoryTaxCodeBody),
      };
    case 'getBulkProductCategories':
      return {
        execute: jest.fn(() => bulkProductCategoriesBody),
      };
    default:
      return {
        execute: jest.fn(() => ({ body: { results: [{}] } })),
      };
  }
};
export const apiRoot: any = (
  buildRequest: CallableFunction,
  requestType = ''
) => {
  return {
    customObjects: jest.fn(() => apiRoot(buildRequest, 'getData')),
    shippingMethods: jest.fn(() => apiRoot(buildRequest, 'getShipTaxCode')),
    customers: jest.fn(() => apiRoot(buildRequest, 'getCustomerEntityUseCode')),
    categories: jest.fn(() => apiRoot(buildRequest, 'getBulkCategoryTaxCode')),
    productProjections: jest.fn(() =>
      apiRoot(buildRequest, 'getBulkProductCategories')
    ),
    search: jest.fn(() => apiRoot(buildRequest, requestType)),
    withId: jest.fn(() => apiRoot(buildRequest, requestType)),
    withContainer: jest.fn(() => apiRoot(buildRequest, requestType)),
    get: jest.fn(() => buildRequest(requestType)),
    post: jest.fn(() => buildRequest(requestType)),
  };
};

export const ServiceApiRoot = apiRoot(buildRequest);
