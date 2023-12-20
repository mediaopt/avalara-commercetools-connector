import { LineItem, Order } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';

// initialize and specify the tax document model of Avalara
export async function processOrder(
  type: string,
  order: Order,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (order?.shippingAddress && order?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(order?.shippingAddress);

    const shippingInfo = await shipItem(type, order?.shippingInfo);

    const itemCategoryTaxCodes = await getCategoryTaxCodes(order?.lineItems);

    const lines = await Promise.all(
      order?.lineItems.map(
        async (x: LineItem) => await lineItem(type, x, itemCategoryTaxCodes)
      )
    );

    const customerInfo = order?.customerId
      ? await getCustomerEntityUseCode(order?.customerId)
      : { customerNumber: 'Guest', exemptCode: '' };

    lines.push(shippingInfo);

    taxDocument.date = new Date();

    taxDocument.code = order?.orderNumber || order.id;

    taxDocument.commit = true;

    taxDocument.companyCode = companyCode;

    taxDocument.type = type === 'refund' ? 5 : 1;

    taxDocument.currencyCode = order?.totalPrice?.currencyCode;

    taxDocument.customerCode = customerInfo?.customerNumber || '';

    taxDocument.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    taxDocument.entityUseCode = customerInfo?.exemptCode;
    taxDocument.lines = lines;
  }

  return taxDocument;
}
