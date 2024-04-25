import { Address } from '@commercetools/platform-sdk';
import { Request } from 'express';

export const fullCart = (address: Address, hash = '123') => {
  return {
    id: '123',
    version: 1,
    customerId: '123',
    lineItems: [
      {
        id: 'id123',
        productId: 'id123',
        name: {
          en: 'Sneakers Philippe Model gold',
          de: 'Sneakers Philippe Model gold',
        },
        variant: {
          id: 1,
          sku: 'sku123',
          key: 'sku123',
        },
        quantity: 2,
        discountedPricePerQuantity: [],
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          includedInPrice: false,
          country: 'US',
          subRates: [],
        },
        totalPrice: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 65500,
          fractionDigits: 2,
        },
        taxedPrice: {
          totalNet: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 65500,
            fractionDigits: 2,
          },
          totalGross: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 70249,
            fractionDigits: 2,
          },
          totalTax: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 4749,
            fractionDigits: 2,
          },
        },
      },
    ],
    customLineItems: [
      {
        id: '641649e5-2337-4871-90ab-164fd3e919b3',
        key: '12345678909',
        name: {
          en: 'Name EN',
          de: 'Name DE',
        },
        money: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 4200,
          fractionDigits: 2,
        },
        slug: 'mySlug',
        quantity: 1,
        discountedPricePerQuantity: [],
        taxCategory: {
          typeId: 'tax-category',
          id: 'ba448eff-36c7-460e-81c6-32cca03b6cf7',
        },
        taxRate: {
          name: 'avaTaxRate',
          amount: 0.0725,
          includedInPrice: false,
          country: 'US',
          subRates: [],
        },
        state: [
          {
            quantity: 1,
            state: {
              typeId: 'state',
              id: 'cd0eacbb-9f15-4a28-9e7e-eaa67e137118',
            },
          },
        ],
        totalPrice: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 4200,
          fractionDigits: 2,
        },
        taxedPrice: {
          totalNet: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 4200,
            fractionDigits: 2,
          },
          totalGross: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 4505,
            fractionDigits: 2,
          },
          taxPortions: [],
          totalTax: {
            type: 'centPrecision',
            currencyCode: 'USD',
            centAmount: 305,
            fractionDigits: 2,
          },
        },
        taxedPricePortions: [],
        perMethodTaxRate: [],
        priceMode: 'Standard',
      },
    ],
    custom: {
      type: 'custom-type',
      fields: {
        avalaraHash: hash,
      },
    },
    totalPrice: {
      type: 'centPrecision',
      currencyCode: 'USD',
      centAmount: 66500,
      fractionDigits: 2,
    },
    taxedPrice: {
      totalNet: {
        type: 'centPrecision',
        currencyCode: 'USD',
        centAmount: 66500,
        fractionDigits: 2,
      },
      totalGross: {
        type: 'centPrecision',
        currencyCode: 'USD',
        centAmount: 71322,
        fractionDigits: 2,
      },
      taxPortions: [],
      totalTax: {
        type: 'centPrecision',
        currencyCode: 'USD',
        centAmount: 4822,
        fractionDigits: 2,
      },
    },
    country: 'US',
    shippingMode: 'Single',
    shippingInfo: {
      shippingMethodName: 'Standard US',
      price: {
        type: 'centPrecision',
        currencyCode: 'USD',
        centAmount: 1000,
        fractionDigits: 2,
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: 0.0725,
        includedInPrice: false,
        country: 'US',
        subRates: [],
      },
      shippingMethod: {
        typeId: 'shipping-method',
        id: '123',
      },
      taxedPrice: {
        totalNet: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 1000,
          fractionDigits: 2,
        },
        totalGross: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 1073,
          fractionDigits: 2,
        },
        totalTax: {
          type: 'centPrecision',
          currencyCode: 'USD',
          centAmount: 73,
          fractionDigits: 2,
        },
      },
      shippingMethodState: 'MatchesCart',
    },
    shippingAddress: address,
    totalLineItemQuantity: 2,
  };
};

export const emptyCart = {
  currency: 'USD',
};

export const cartRequest = (cart: any) => {
  return {
    body: {
      action: 'Update',
      resource: {
        typeId: 'cart',
        obj: cart,
      },
    },
  } as Request;
};
