import { Address } from '@commercetools/platform-sdk';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

// Mapping CT Address Model to Avalara Address Model
export function shippingAddress(address: Address) {
  const shipTo = new AddressInfo();
  shipTo.line1 = address?.streetName as string;
  shipTo.line2 = address?.streetNumber as string;
  shipTo.line3 = address?.additionalStreetInfo as string;
  shipTo.postalCode = address?.postalCode as string;
  shipTo.city = address?.city as string;
  shipTo.region = address?.state as string;
  shipTo.country = address?.country as string;

  return shipTo;
}
