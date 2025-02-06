import { Cart, CustomLineItem, LineItem } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { customLineItem } from '../../utils/custom.line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { customShipItem } from '../../utils/custom.shipping.info';

// initialize and specify the tax document model of Avalara
export async function processCart(
  cart: Cart,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (cart?.shippingAddress && (cart?.shippingInfo || cart?.shipping)) {
    const shipFrom = originAddress;

    let shipTo;

    let shippingInfo;

    if (cart?.shippingInfo) {
      shippingInfo = await shipItem(cart?.shippingInfo);
      shipTo = shippingAddress(cart?.shippingAddress);
    } else if (cart?.shipping) {
      const shipping = cart?.shipping[0];
      shippingInfo = customShipItem(shipping);
      shipTo = shippingAddress(shipping.shippingAddress);
    }

    const itemCategoryTaxCodes = await getCategoryTaxCodes(cart?.lineItems);

    const lines = cart?.lineItems
      .map((x: LineItem) => lineItem(x, itemCategoryTaxCodes))
      .concat(
        cart?.customLineItems
          ? cart?.customLineItems.map((x: CustomLineItem) => customLineItem(x))
          : []
      );

    if (shippingInfo) {
      lines.push(shippingInfo);
    }

    taxDocument.date = new Date();

    taxDocument.code = '0';

    taxDocument.commit = false;

    taxDocument.companyCode = companyCode;

    taxDocument.type = 0;

    taxDocument.currencyCode = cart?.totalPrice?.currencyCode;

    taxDocument.customerCode = '0';

    taxDocument.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };

    taxDocument.entityUseCode = cart?.customerId
      ? await getCustomerEntityUseCode(cart?.customerId as string)
      : '';
    taxDocument.lines = lines;
  }

  return taxDocument;
}
