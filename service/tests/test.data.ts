import { AvataxMerchantConfig } from '../src/types/index.types';

export const avalaraMerchantDataBody = {
  body: {
    results: [
      {
        key: 'settings',
        value: {
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
