import {
  OrderCreatedMessage,
  OrderStateChangedMessage,
} from '@commercetools/platform-sdk';
import { AvataxMerchantConfig } from '../src/types/index.types';

export const avalaraMerchantDataBody = (disableDocRec: boolean) => {
  return {
    body: {
      results: [
        {
          key: 'settings',
          value: {
            logLevel: '3',
            addressValidation: true,
            disableDocRec: disableDocRec,
            taxCalculation: 'USCA',
            enableLogging: true,
            line1: '505 Beasley St',
            line2: '',
            line3: '',
            postalCode: '39201',
            city: 'Jackson',
            region: 'MS',
            country: 'US',
          } as AvataxMerchantConfig,
        },
      ],
    },
  };
};

export const shipTaxCodeBody = (code: string) => {
  return {
    body: {
      custom: {
        fields: {
          avalaraTaxCode: code,
        },
      },
    },
  };
};

export const entityUseCodeBody = (code: string) => {
  return {
    body: {
      customerNumber: '123',
      custom: {
        fields: {
          avalaraEntityUseCode: code,
        },
      },
    },
  };
};

export const bulkCategoryTaxCodeBody = (codes: Array<string>) => {
  return {
    body: {
      results: [
        {
          id: '123',
          custom: {
            fields: {
              avalaraTaxCode: codes[0],
            },
          },
        },
        {
          id: '456',
          custom: {
            fields: {
              avalaraTaxCode: codes[1],
            },
          },
        },
      ],
    },
  };
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

export const order = (orderNumber: string, country: string) => {
  return {
    createdAt: '2021-06-01T00:00:00.000Z',
    id: '123',
    version: 1,
    shippingAddress: {
      streetName: 'Main Street',
      streetNumber: '2000',
      postalCode: '92614',
      city: 'Irvine',
      country: country,
    },
    shippingInfo: {
      shippingMethod: {
        id: '123',
      },
      shippingMethodName: 'Standard',
      price: {
        currencyCode: 'USD',
        centAmount: 123,
      },
      taxRate: {
        includedInPrice: false,
      },
    },
    orderNumber: orderNumber,
    customerId: '123',
    totalPrice: {
      currencyCode: 'USD',
      centAmount: 24600,
    },
    lineItems: [
      {
        quantity: 2,
        totalPrice: {
          currencyCode: 'USD',
          centAmount: 12300,
        },
        name: {
          en: 'Test Product',
        },
        taxRate: {
          includedInPrice: false,
        },
        variant: {
          id: 1,
          sku: 'sku123',
        },
      },
    ],
  };
};

export const orderRequest = (orderNumber: string, country: string) => {
  return {
    body: order(orderNumber, country),
  };
};

export const messageOrderCreated = (orderNumber: string, country: string) => {
  return {
    type: 'OrderCreated',
    id: '123',
    version: 1,
    createdAt: '2021-06-01T00:00:00.000Z',
    lastModifiedAt: '2021-06-01T00:00:00.000Z',
    sequenceNumber: 1,
    resource: {
      typeId: 'order',
      id: '123',
      version: 1,
      createdAt: '2021-06-01T00:00:00.000Z',
      lastModifiedAt: '2021-06-01T00:00:00.000Z',
      customerId: '123',
      customerEmail: '',
    },
    resourceVersion: 1,
    order: order(orderNumber, country),
  } as unknown as OrderCreatedMessage;
};

export const messageOrderStateChanged = {
  type: 'OrderStateChanged',
  id: '123',
  version: 1,
  createdAt: '2021-06-01T00:00:00.000Z',
  lastModifiedAt: '2021-06-01T00:00:00.000Z',
  sequenceNumber: 1,
  resource: {
    typeId: 'order',
    id: '123',
    version: 1,
    createdAt: '2021-06-01T00:00:00.000Z',
    lastModifiedAt: '2021-06-01T00:00:00.000Z',
  },
  resourceVersion: 1,
  oldOrderState: 'Open',
  orderState: 'Cancelled',
} as unknown as OrderStateChangedMessage;
