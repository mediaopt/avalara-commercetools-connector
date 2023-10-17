import { LineItem, Order } from '@commercetools/platform-sdk';
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
export async function processOrder(
  order: Order,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (order?.shippingAddress && order?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(order?.shippingAddress);

    const shippingInfo = await shipItem(order?.shippingInfo);

    const itemCategoryTaxCodes = await getCategoryTaxCodes(order?.lineItems);

    const lines = await Promise.all(
      order?.lineItems.map(
        async (x: LineItem) => await lineItem(x, itemCategoryTaxCodes)
      )
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
    taxDocument.entityUseCode = await getCustomerEntityUseCode(
      order?.customerId || ''
    );
    taxDocument.lines = lines;
  }

  return taxDocument;
}
