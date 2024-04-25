import { Cart, CustomLineItem, LineItem } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { customLineItem } from '../../utils/custom.line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';

// initialize and specify the tax document model of Avalara
export async function processCart(
  cart: Cart,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (cart?.shippingAddress && cart?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(cart?.shippingAddress);

    const shippingInfo = await shipItem(cart?.shippingInfo);

    const itemCategoryTaxCodes = await getCategoryTaxCodes(cart?.lineItems);

    const lines = await Promise.all(
      cart?.lineItems.map(
        async (x: LineItem) => await lineItem(x, itemCategoryTaxCodes)
      )
    ).then((x) =>
      cart?.customLineItems
        ? x.concat(
            cart?.customLineItems.map((x: CustomLineItem) => customLineItem(x))
          )
        : x
    );

    lines.push(shippingInfo);

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
