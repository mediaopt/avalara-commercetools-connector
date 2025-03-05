import AvaTaxClient from 'avatax/lib/AvaTaxClient';
import { VoidTransactionModel } from 'avatax/lib/models/VoidTransactionModel';
import { getOrder } from '../../../client/data.client';
import { TaxOverrideModel } from 'avatax/lib/models/TaxOverrideModel';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { processOrder } from '../preprocess/preprocess.order';

export async function voidTransaction(
  orderId: string,
  creds: { [key: string]: string },
  config: any
) {
  const order = await getOrder(orderId);

  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'default')) {
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

export async function refundTransaction(
  orderId: string,
  creds: { [key: string]: string },
  originAddress: AddressInfo,
  config: any
) {
  const order = await getOrder(orderId);

  if (!['US', 'CA'].includes(order?.shippingAddress?.country || 'default')) {
    return;
  }
  const client = new AvaTaxClient(config).withSecurity(creds);

  const taxDocument = await processOrder(
    'refund',
    order,
    creds?.companyCode,
    originAddress
  );

  taxDocument.createTransactionModel.referenceCode = 'Refund';

  const taxModel = new TaxOverrideModel();
  taxModel.taxDate = new Date(order.createdAt);
  taxModel.type = 3;
  taxModel.reason = 'Refund';
  taxDocument.createTransactionModel.taxOverride = taxModel;

  const taxResponse = await client.createOrAdjustTransaction({
    model: taxDocument,
  });
  return taxResponse;
}
