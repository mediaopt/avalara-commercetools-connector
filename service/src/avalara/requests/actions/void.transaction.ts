import { Order } from '@commercetools/platform-sdk';
import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { processOrder } from '../preprocess/preprocess.order';
import { VoidTransactionModel } from 'avatax/lib/models/VoidTransactionModel';

export async function voidTransaction(
  order: Order,
  creds: { [key: string]: string },
  config: any
) {
  const client = new AvaTaxClient(config).withSecurity(creds);

  const voidModel = new VoidTransactionModel;
  voidModel.code = 3;
  const voidBody = { 
    companyCode: creds.companyCode,
    transactionCode: order.id, 
    documentType: 1,
    model: voidModel
  }

  const taxResponse = await client.voidTransaction(voidBody)

  return taxResponse;
}
