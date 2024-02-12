import { Cart } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processCart } from '../preprocess/preprocess.get.tax';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

export async function getTax(
  cart: Cart,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any,
  pricesIncludesTax: boolean
) {
  const client = new AvaTaxClient(config).withSecurity(creds);
  const taxDocument = await processCart(
    cart,
    creds?.companyCode,
    originAddress,
    pricesIncludesTax
  );

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
