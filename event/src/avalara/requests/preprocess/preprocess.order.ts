import { LineItem, Order } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { TransactionParameterModel } from 'avatax/lib/models/TransactionParameterModel';

function extractVatId(order: Order) {
  const paymentCustomerVatIds = order?.paymentInfo?.payments.map(
    (payment) => payment.obj?.customer?.obj?.vatId
  );
  const vatId = paymentCustomerVatIds?.find((vatId) => vatId !== undefined);

  return vatId || order?.customerId;
}

// initialize and specify the tax document model of Avalara
export async function processOrder(
  type: string,
  order: Order,
  companyCode: string,
  originAddress: AddressInfo,
  pricesIncludesTax: boolean
): Promise<CreateTransactionModel> {
  const taxDocument = new CreateTransactionModel();

  if (order?.shippingAddress && order?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(order?.shippingAddress);

    const shippingInfo = await shipItem(
      type,
      order?.shippingInfo,
      pricesIncludesTax
    );

    const itemCategoryTaxCodes = await getCategoryTaxCodes(order?.lineItems);

    const lines = await Promise.all(
      order?.lineItems.map(
        async (x: LineItem) =>
          await lineItem(type, x, itemCategoryTaxCodes, pricesIncludesTax)
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

    taxDocument.type =
      type === 'refund'
        ? DocumentType.ReturnInvoice
        : DocumentType.SalesInvoice;

    taxDocument.currencyCode = order?.totalPrice?.currencyCode;

    taxDocument.customerCode = customerInfo?.customerNumber || '';

    taxDocument.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    taxDocument.entityUseCode = customerInfo?.exemptCode;
    taxDocument.lines = lines;

    taxDocument.businessIdentificationNo = extractVatId(order);
    taxDocument.parameters = [
      {
        name: 'Transport',
        value:
          taxDocument.type === DocumentType.SalesInvoice ? 'Seller' : 'Buyer',
        unit: '',
      } as TransactionParameterModel,
    ];
  }

  return taxDocument;
}
