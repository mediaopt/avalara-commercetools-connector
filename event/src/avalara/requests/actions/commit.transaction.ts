import { Order } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processOrder } from '../preprocess/preprocess.order';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

export async function commitTransaction(
  order: Order,
  credentials: { [key: string]: string },
  originAddress: AddressInfo,
  config: any,
  pricesIncludesTax: boolean
) {
  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'default')) {
    return undefined;
  }
  const client = new AvaTaxClient(config).withSecurity(credentials);

  const taxDocument = await processOrder(
    'commit',
    order,
    credentials?.companyCode,
    originAddress,
    pricesIncludesTax
  );

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
