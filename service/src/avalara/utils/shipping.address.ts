import { Address } from '@commercetools/platform-sdk';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

// Mapping CT Address Model to Avalara Address Model
export function shippingAddress(address: Address) {
  const shipTo = new AddressInfo();

  shipTo.line1 = address?.streetNumber + ' ' + address?.streetName;

  shipTo.line2 = address?.additionalStreetInfo as string;

  shipTo.line3 = '';

  shipTo.postalCode = address?.postalCode as string;

  shipTo.city = address?.city as string;

  shipTo.region = address?.state as string;

  shipTo.country = address?.country as string;

  return shipTo;
}
