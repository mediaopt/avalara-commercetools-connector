import { Order } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processOrder } from '../preprocess/preprocess.order';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

export async function commitTransaction(
  order: Order,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any
) {
  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'none')) {
    return undefined;
  }
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'commit',
    order,
    creds?.companyCode,
    originAddress
  );

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
