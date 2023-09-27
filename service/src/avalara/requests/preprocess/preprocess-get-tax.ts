import { Cart, LineItem } from '@commercetools/platform-sdk';
import { getData } from '../../../client/create.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line-items';
import { shippingAddress } from '../../utils/shipping-address';
import { shipItem } from '../../utils/shipping-info';

// initialize and specify the tax document model of Avalara
export async function processCart(
  cart: Cart,
  companyCode: string
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  const shipFrom = await getData('avalaraOriginAddress');

  const shipTo = shippingAddress(cart?.shippingAddress!);

  const lines: any = [...cart?.lineItems];

  const shippingInfo = shipItem(cart?.shippingInfo!);

  lines.map((x: LineItem) => lineItem(x));

  lines.push(shippingInfo);

  taxDocument.date = new Date();
  taxDocument.code = '0';
  taxDocument.commit = false;
  //taxDocument.discount = totalDiscount;
  taxDocument.companyCode = companyCode;
  taxDocument.type = 0;
  taxDocument.currencyCode = 'USD'; //???
  taxDocument.customerCode = cart?.customerId || '';
  taxDocument.addresses = {
    shipFrom: shipFrom,
    shipTo: shipTo,
  };
  //taxDocument.entityUseCode = context?.customerExemption;
  taxDocument.lines = lines;

  return taxDocument;
}
