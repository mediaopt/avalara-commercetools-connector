import { Address } from '@commercetools/platform-sdk';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

// Mapping CT Address Model to Avalara Address Model
export function shippingAddress(address: Address) {
  const shipTo = new AddressInfo();

  shipTo.line1 = address?.streetName || '';

  shipTo.line2 = address?.streetNumber || '';

  shipTo.line3 = address?.additionalStreetInfo || '';

  shipTo.postalCode = address?.postalCode || '';

  shipTo.city = address?.city || '';

  shipTo.region = address?.state || '';

  shipTo.country = address?.country || '';

  return shipTo;
}
