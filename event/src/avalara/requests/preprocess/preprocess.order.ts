import { CustomLineItem, LineItem, Order } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { customLineItem } from '../../utils/custom.line.items';
import { customShipItem } from '../../utils/custom.shipping.info';

// initialize and specify the tax document model of Avalara
export async function processOrder(
  type: string,
  order: Order,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (order?.shippingAddress && (order?.shippingInfo || order?.shipping)) {
    const shipFrom = originAddress;

    let shipTo;

    let shippingInfo;

    if (order?.shippingInfo) {
      shippingInfo = await shipItem(type, order?.shippingInfo);
      shipTo = shippingAddress(order?.shippingAddress);
    } else if (order?.shipping) {
      const shipping = order?.shipping[0];
      shippingInfo = await customShipItem(type, shipping);
      shipTo = shippingAddress(shipping.shippingAddress);
    }

    const itemCategoryTaxCodes = await getCategoryTaxCodes(order?.lineItems);

    const lines = order?.lineItems
      .map((x: LineItem) => lineItem(type, x, itemCategoryTaxCodes))
      .concat(
        order?.customLineItems
          ? order?.customLineItems.map((x: CustomLineItem) =>
              customLineItem(type, x)
            )
          : []
      );

    const customerInfo = order?.customerId
      ? await getCustomerEntityUseCode(order?.customerId)
      : { customerNumber: 'Guest', exemptCode: '' };

    if (shippingInfo) {
      lines.push(shippingInfo);
    }

    taxDocument.date = new Date();

    taxDocument.code = order?.orderNumber || order.id;

    taxDocument.commit = true;

    taxDocument.companyCode = companyCode;

    taxDocument.type = type === 'refund' ? 5 : 1;

    taxDocument.currencyCode = order?.totalPrice?.currencyCode;

    taxDocument.customerCode = customerInfo?.customerNumber as string;

    taxDocument.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    taxDocument.entityUseCode = customerInfo?.exemptCode;
    taxDocument.lines = lines;
  }

  return taxDocument;
}
