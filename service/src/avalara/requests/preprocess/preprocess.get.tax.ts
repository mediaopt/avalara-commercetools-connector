import { Cart, LineItem } from '@commercetools/platform-sdk';
import {
  getCustomerEntityUseCode,
  getCustomerVatId,
} from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { TransactionParameterModel } from 'avatax/lib/models/TransactionParameterModel';
import { DocumentType } from 'avatax/lib/enums/DocumentType';

// initialize and specify the tax document model of Avalara
export async function processCart(
  cart: Cart,
  companyCode: string,
  originAddress: AddressInfo,
  pricesIncludesTax: boolean
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (cart?.shippingAddress && cart?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(cart?.shippingAddress);

    const shippingInfo = await shipItem(cart?.shippingInfo, pricesIncludesTax);

    const itemCategoryTaxCodes = await getCategoryTaxCodes(cart?.lineItems);

    const lines = await Promise.all(
      cart?.lineItems.map(
        async (x: LineItem) =>
          await lineItem(x, itemCategoryTaxCodes, pricesIncludesTax)
      )
    );

    lines.push(shippingInfo);

    taxDocument.date = new Date();

    taxDocument.code = '0';

    taxDocument.commit = false;
    taxDocument.companyCode = companyCode;

    taxDocument.type = DocumentType.SalesOrder;

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

    taxDocument.businessIdentificationNo = await getCustomerVatId(
      cart?.customerId
    );
    taxDocument.parameters = [
      {
        name: 'Transport',
        value: 'Seller',
        unit: '',
      } as TransactionParameterModel,
    ];
  }

  return taxDocument;
}
