import { Cart } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processCart } from '../preprocess/preprocess-get-tax';

export async function getTax(
  cart: Cart,
  creds: { [key: string]: string },
  config: any
) {
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processCart(cart, creds?.companyCode);

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
