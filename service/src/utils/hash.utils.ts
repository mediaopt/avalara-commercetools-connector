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
    shippingAddress: cart?.shippingAddress,
    lineItems: cart?.lineItems,
    shippingInfo: cart?.shippingInfo,
  };
  return hashInvariantObject(data);
}
