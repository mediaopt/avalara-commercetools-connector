import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { VoidTransactionModel } from 'avatax/lib/models/VoidTransactionModel';
import { getOrder } from '../../../client/create.client';

export async function voidTransaction(
  orderId: string,
  creds: { [key: string]: string },
  config: any
) {
  const order = await getOrder(orderId);

  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'none')) {
    return;
  }

  const client = new AvaTaxClient(config).withSecurity(creds);

  const voidModel = new VoidTransactionModel();
  voidModel.code = 3;
  const voidBody = {
    companyCode: creds.companyCode,
    transactionCode: order?.orderNumber || orderId,
    documentType: 1,
    model: voidModel,
  };

  const taxResponse = await client.voidTransaction(voidBody);

  return taxResponse;
}
