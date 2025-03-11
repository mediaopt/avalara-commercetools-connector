export const order = (data: { orderNumber: string; country: string }) => {
  return {
    createdAt: '2021-06-01T00:00:00.000Z',
    id: '123',
    version: 1,
    shippingAddress: {
      streetName: 'Main Street',
      streetNumber: '2000',
      postalCode: '92614',
      city: 'Irvine',
      country: data.country,
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
    orderNumber: data.orderNumber,
    customerId: '123',
    totalPrice: {
      currencyCode: 'USD',
      centAmount: 24600,
    },
    lineItems: [
      {
        quantity: 2,
        id: '123',
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
    returnInfo: [
      {
        items: [
          {
            id: '123',
            quantity: 1,
            lineItemId: '123',
            shipmentState: 'Delivered',
            paymentState: 'Refunded',
          },
        ],
      },
    ],
  };
};
