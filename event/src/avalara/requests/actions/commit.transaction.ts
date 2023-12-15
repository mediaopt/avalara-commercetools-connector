import { Order } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processOrder } from '../preprocess/preprocess.order';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { ByProjectKeyRequestBuilder } from '@commercetools/platform-sdk/dist/declarations/src/generated/client/by-project-key-request-builder';

export async function commitTransaction(
  order: Order,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any,
  apiRoot: ByProjectKeyRequestBuilder
) {
  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'none')) {
    return false;
  }
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'commit',
    order,
    creds?.companyCode,
    originAddress,
    apiRoot
  );

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
