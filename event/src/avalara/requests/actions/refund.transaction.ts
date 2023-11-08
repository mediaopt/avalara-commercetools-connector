import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { RefundTransactionModel } from 'avatax/lib/models/RefundTransactionModel';

export async function refundTransaction(
  orderId: string,
  creds: { [key: string]: string },
  config: any
) {
  const client = new AvaTaxClient(config).withSecurity(creds);

  const refundModel = new RefundTransactionModel();
  refundModel.refundTransactionCode = orderId;
  refundModel.refundDate = new Date();
  refundModel.refundType = 0;
  refundModel.referenceCode = 'Refund for a committed transaction';

  const refundBody = {
    companyCode: creds.companyCode,
    transactionCode: orderId,
    model: refundModel,
  };

  const taxResponse = await client.refundTransaction(refundBody);

  return taxResponse;
}
