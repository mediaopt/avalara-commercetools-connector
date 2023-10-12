import { LineItem, Order } from '@commercetools/platform-sdk';
import { getCustomerEntityCode, getData } from '../../../client/create.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

// initialize and specify the tax document model of Avalara
export async function processOrder(
  order: Order,
  companyCode: string, 
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  const shipFrom = originAddress;

  const shipTo = shippingAddress(order?.shippingAddress!);

  const shippingInfo = await shipItem(order?.shippingInfo!);

  const lines = await Promise.all(
    order?.lineItems.map(async (x: LineItem) => await lineItem(x))
  );

  lines.push(shippingInfo);

  taxDocument.date = new Date();
  taxDocument.code = order.id;
  taxDocument.commit = true;
  taxDocument.companyCode = companyCode;
  taxDocument.type = 1;
  taxDocument.currencyCode = order?.totalPrice?.currencyCode;
  taxDocument.customerCode = order?.customerId || '';
  taxDocument.addresses = {
    shipFrom: shipFrom,
    shipTo: shipTo,
  };
  taxDocument.entityUseCode = await getCustomerEntityCode(
    order?.customerId || ''
  );
  taxDocument.lines = lines;

  return taxDocument;
}
