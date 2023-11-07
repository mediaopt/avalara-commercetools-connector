import { Cart, LineItem } from '@commercetools/platform-sdk';
import {
  getBulkCategoryTaxCode,
  getBulkProductCategories,
  getCustomerEntityUseCode,
} from '../../../client/create.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';

async function getCategoryTaxCodes(items: Array<LineItem>) {
  const itemsWithoutTaxCodes = items
    .filter(
      (x) =>
        x?.variant?.attributes?.filter((attr) => attr.name === 'avatax-code')[0]
          ?.value === undefined
    )
    ?.map((x) => x.productKey);

  const categoryData = await getBulkProductCategories(itemsWithoutTaxCodes);

  const listOfCategories: any = [
    ...new Set(
      categoryData
        .map((x: any) => x.categories)
        .reduce((acc: any, curr: any) => curr.concat(acc), [])
    ),
  ];

  const catTaxCodes = await getBulkCategoryTaxCode(listOfCategories);

  return categoryData.map((x: any) => ({
    productKey: x.productKey,
    taxCode: x.categories
      .map((x: any) => catTaxCodes.find((y) => y.id === x)?.avalaraTaxCode)
      .find((x: any) => x !== undefined),
  }));
}

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
    );

    lines.push(shippingInfo);

    taxDocument.date = new Date();

    taxDocument.code = '0';

    taxDocument.commit = false;

    taxDocument.companyCode = companyCode;

    taxDocument.type = 0;

    taxDocument.currencyCode = cart?.totalPrice?.currencyCode;

    taxDocument.customerCode = cart?.customerId || cart?.anonymousId || '';

    taxDocument.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };

    taxDocument.entityUseCode = await getCustomerEntityUseCode(
      cart?.customerId || ''
    );
    taxDocument.lines = lines;
  }

  return taxDocument;
}
