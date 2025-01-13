import { Cart } from '@commercetools/platform-sdk';
import crypto from 'crypto';

// make Object invariant under key ordering

function sortObjectKeys(obj: any) {
  if (obj == null) {
    return obj;
  }
  if (typeof obj != 'object') {
    // it is a primitive: number/string (in an array)
    return obj;
  }
  return Object.keys(obj)
    .sort()
    .reduce((acc: any, key) => {
      if (Array.isArray(obj[key])) {
        acc[key] = obj[key].map(sortObjectKeys);
      } else if (typeof obj[key] === 'object') {
        acc[key] = sortObjectKeys(obj[key]);
      } else {
        acc[key] = obj[key];
      }
      return acc;
    }, {});
}
function hashInvariantObject(obj: any) {
  const sortedObject: any = sortObjectKeys(obj);
  const jsonString = JSON.stringify(sortedObject);

  // Remove all whitespace
  const jsonStringNoWhitespace: string = jsonString.replace(/\s+/g, '');

  return crypto.createHash('md5').update(jsonStringNoWhitespace).digest('hex');
}

export function hashCart(cart: Cart) {
  const data = {
    customerId: cart?.customerId,
    shippingAddress: {
      line1: cart?.shippingAddress?.streetName,
      line2: cart?.shippingAddress?.streetNumber,
      line3: cart?.shippingAddress?.additionalStreetInfo,
      postalCode: cart?.shippingAddress?.postalCode,
      city: cart?.shippingAddress?.city,
      region: cart?.shippingAddress?.state,
      country: cart?.shippingAddress?.country,
    },
    lineItems: cart?.lineItems.map((lineItem) => ({
      avalaraTaxCode: lineItem?.variant?.attributes?.filter(
        (attr) =>
          attr.name === (process.env.AVATAX_PRODUCT_ATTRIBUTE_NAME as string)
      )[0]?.value,
      sku: lineItem?.variant?.sku,
      quantity: lineItem?.quantity,
      discounted: lineItem?.discountedPricePerQuantity,
      totalPrice: lineItem?.totalPrice,
      includedInPrice: lineItem?.taxRate?.includedInPrice,
    })),
    customLineItems: cart?.customLineItems.map((customLineItem) => ({
      avalaraTaxCode: customLineItem?.custom?.fields?.avalaraTaxCode,
      sku: customLineItem?.name,
      quantity: customLineItem?.quantity,
      discounted: customLineItem?.discountedPricePerQuantity,
      totalPrice: customLineItem?.totalPrice,
      includedInPrice: customLineItem?.taxRate?.includedInPrice,
    })),
    shippingInfo: {
      id: cart?.shippingInfo?.shippingMethod?.id,
      price: cart?.shippingInfo?.price,
      includedInPrice: cart?.shippingInfo?.taxRate?.includedInPrice,
    },
  };
  return hashInvariantObject(data);
}
