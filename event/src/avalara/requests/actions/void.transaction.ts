import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { VoidTransactionModel } from 'avatax/lib/models/VoidTransactionModel';
import { getOrder } from '../../../client/data.client';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { VoidReasonCode } from 'avatax/lib/enums/VoidReasonCode';

export async function voidTransaction(
  orderId: string,
  credentials: { [key: string]: string },
  config: any
) {
  const order = await getOrder(orderId);

  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'none')) {
    return undefined;
  }
  const client = new AvaTaxClient(config).withSecurity(credentials);

  const voidModel = new VoidTransactionModel();
  voidModel.code = VoidReasonCode.DocVoided;
  const voidBody = {
    companyCode: credentials.companyCode,
    transactionCode: order?.orderNumber || orderId,
    documentType: DocumentType.SalesInvoice,
    model: voidModel,
  };

  const taxResponse = await client.voidTransaction(voidBody);

  return taxResponse;
}
