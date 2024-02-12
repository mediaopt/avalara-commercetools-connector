import { Address } from '@commercetools/platform-sdk';
import { Request } from 'express';

const currencyCode = 'USD';
const taxRateAmount = 0.0725;

const baseItemPriceInCent = 65500;
const baseItemPriceTaxForExcludedTaxPriceInCent = Math.round(
  baseItemPriceInCent * taxRateAmount
);
const baseItemPriceTaxForIncludedTaxPriceInCent = Math.round(
  baseItemPriceInCent - baseItemPriceInCent / (1 + taxRateAmount)
);

const baseItemShippingPriceInCent = 1000;
const baseItemShippingPriceTaxInCent = Math.round(
  baseItemShippingPriceInCent * taxRateAmount
);
const baseItemShippingPriceTaxForIncludedTaxShippingPriceInCent = Math.round(
  baseItemShippingPriceInCent -
    baseItemShippingPriceInCent / (1 + taxRateAmount)
);

const taxRate = {
  name: 'avaTaxRate',
  amount: taxRateAmount,
  includedInPrice: false,
  country: 'US',
  subRates: [],
};

const price = {
  type: 'centPrecision',
  currencyCode: currencyCode,
  centAmount: 0,
  fractionDigits: 2,
};

const itemTotalPrice = {
  ...price,
  centAmount: baseItemPriceInCent,
};

const itemTotalTax = {
  ...price,
  centAmount: baseItemPriceTaxForExcludedTaxPriceInCent,
};

const itemTaxedPrice = {
  totalNet: itemTotalPrice,
  totalGross: {
    ...price,
    centAmount: itemTotalPrice.centAmount + itemTotalTax.centAmount,
  },
  totalTax: itemTotalTax,
};

const totalShippingPrice = {
  ...price,
  centAmount: baseItemShippingPriceInCent,
};

const totalShippingTax = {
  ...price,
  centAmount: baseItemShippingPriceTaxInCent,
};

const totalShippingTaxedPrice = {
  totalNet: totalShippingPrice,
  totalGross: {
    ...price,
    centAmount: totalShippingPrice.centAmount + totalShippingTax.centAmount,
  },
  totalTax: totalShippingTax,
};

const totalPrice = {
  ...itemTotalPrice,
  centAmount: itemTotalPrice.centAmount + totalShippingPrice.centAmount,
};

const totalTax = {
  ...itemTotalTax,
  centAmount: itemTotalTax.centAmount + totalShippingTax.centAmount,
};

const totalTaxedPrice = {
  totalNet: totalPrice,
  totalGross: {
    ...price,
    centAmount: totalPrice.centAmount + totalTax.centAmount,
  },
  totalTax: totalTax,
};

const lineItem = {
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
  taxRate: taxRate,
  totalPrice: itemTotalPrice,
  taxedPrice: itemTaxedPrice,
};

const shippingInfo = {
  shippingMethodName: 'Standard US',
  price: totalShippingPrice,
  taxRate: taxRate,
  shippingMethod: {
    typeId: 'shipping-method',
    id: '123',
  },
  taxedPrice: totalShippingTaxedPrice,
  shippingMethodState: 'MatchesCart',
};

const cart = {
  id: '123',
  version: 1,
  customerId: '123',
  lineItems: [lineItem],
  totalPrice: totalPrice,
  taxedPrice: {
    ...totalTaxedPrice,
    taxPortions: [],
  },
  country: 'US',
  shippingMode: 'Single',
  shippingInfo: shippingInfo,
  totalLineItemQuantity: 2,
};

export const fullCart = (address: Address, hash = '123') => {
  return {
    ...cart,
    custom: {
      fields: {
        avahash: hash,
      },
    },
    shippingAddress: address,
  };
};

export const cartWithTaxIncludedPrices = (address: Address, hash = '123') => {
  const totalNetCentAmount =
    baseItemPriceInCent - baseItemPriceTaxForIncludedTaxPriceInCent;
  const shippingTaxedPriceTotalNetInCent =
    baseItemShippingPriceInCent -
    baseItemShippingPriceTaxForIncludedTaxShippingPriceInCent;
  return {
    ...cart,
    lineItems: [
      {
        ...lineItem,
        taxRate: { ...taxRate, includedInPrice: true },
        taxedPrice: {
          totalNet: {
            ...price,
            centAmount: totalNetCentAmount,
          },
          totalGross: itemTotalPrice,
          totalTax: {
            ...price,
            centAmount: baseItemPriceTaxForIncludedTaxPriceInCent,
          },
        },
      },
    ],
    shippingInfo: {
      ...shippingInfo,
      taxRate: { ...taxRate, includedInPrice: true },
      taxedPrice: {
        totalNet: {
          ...price,
          centAmount: shippingTaxedPriceTotalNetInCent,
        },
        totalGross: totalShippingPrice,
        totalTax: {
          ...price,
          centAmount: baseItemShippingPriceTaxForIncludedTaxShippingPriceInCent,
        },
      },
    },
    totalPrice: itemTotalPrice,
    taxedPrice: {
      totalNet: {
        ...price,
        centAmount: totalPrice.centAmount - totalTax.centAmount,
      },
      totalGross: totalPrice,
      totalTax: {
        ...price,
        centAmount: totalTax.centAmount,
      },
    },
    custom: {
      fields: {
        avahash: hash,
      },
    },
    shippingAddress: address,
  };
};

export const emptyCart = {
  currency: currencyCode,
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
