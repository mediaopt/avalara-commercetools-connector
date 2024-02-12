import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { getOrder } from '../../../client/data.client';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { processOrder } from '../preprocess/preprocess.order';

export async function refundTransaction(
  orderId: string,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any,
  pricesIncludesTax: boolean
) {
  const order = await getOrder(orderId);

  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'none')) {
    return undefined;
  }
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'refund',
    order,
    creds?.companyCode,
    originAddress,
    pricesIncludesTax
  );

  taxDocument.referenceCode = 'Refund';

  const taxModel = new TaxOverrideModel();
  taxModel.taxDate = new Date(order.createdAt);
  taxModel.type = 3;
  taxModel.reason = 'Refund';
  taxDocument.taxOverride = taxModel;

  const taxResponse = await client.createTransaction({ model: taxDocument });

  return taxResponse;
}
