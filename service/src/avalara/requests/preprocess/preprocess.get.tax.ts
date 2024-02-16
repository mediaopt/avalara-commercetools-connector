import { Cart, LineItem } from '@commercetools/platform-sdk';
import {
  getCustomerEntityUseCode,
  getDiscountInfo,
} from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { discount } from '../../utils/discounts';

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

    const itemCategoryTaxCodes = await getCategoryTaxCodes(cart?.lineItems);

    const lines = await Promise.all(
      cart?.lineItems.map(
        async (x: LineItem) => await lineItem(x, itemCategoryTaxCodes)
      )
    );

    const shippingInfo = await shipItem(cart?.shippingInfo);

    lines.push(shippingInfo);

    const includedDiscounts = cart?.discountOnTotalPrice?.includedDiscounts;

    const discountsInfo = await getDiscountInfo(
      includedDiscounts?.map((x) => x.discount.id) as string[]
    );

    const discounts = await Promise.all(
      includedDiscounts?.map(async (x) => await discount(x, discountsInfo)) ||
        []
    );

    lines.push(...discounts);

    taxDocument.lines = lines;

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

    taxDocument.entityUseCode = await getCustomerEntityUseCode(
      cart?.customerId || ''
    );
  }

  return taxDocument;
}
