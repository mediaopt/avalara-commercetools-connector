import { Cart } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processCart } from '../preprocess/preprocess.get.tax';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

export async function getTax(
  cart: Cart,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any,
  apiRoot: ByProjectKeyRequestBuilder
) {
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processCart(
    cart,
    creds?.companyCode,
    originAddress,
    apiRoot
  );

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
