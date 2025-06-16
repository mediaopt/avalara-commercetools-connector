import { Order } from '@commercetools/platform-sdk';
import { extractTaxCodesFromCategories } from '../../helpers/tax.code.helpers';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { AvataxTransactionManager } from '../..';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { extractEntityUseCode } from '../../helpers/entity.use.code.helpers';
import { convertShippingAddressModel } from '../shipping.address.model';
import { convertLineItemModel } from '../line-item-model/line.item.model';
import { convertCustomLineItemModel } from '../line-item-model/custom.line.item.model';
import { convertShippingInfoModel } from '../line-item-model/shipping.info.model';

// initialize and specify the tax document model of Avalara
export async function createTransactionModel(
  order: Order,
  transactionManager: AvataxTransactionManager,
  params: { [key: string]: any } = {}
): Promise<CreateTransactionModel> {
  let transaction = new CreateTransactionModel();

  if (order?.shippingAddress && order?.shippingInfo) {
    const shipFrom = transactionManager.originAddress;

    const shipTo = convertShippingAddressModel(order?.shippingAddress);

    const productsWithCategoryTaxCodes = await extractTaxCodesFromCategories(
      order?.lineItems
    );

    const lines = order?.lineItems
      .map((x) => convertLineItemModel(x, productsWithCategoryTaxCodes))
      .concat(
        order?.customLineItems
          ? order?.customLineItems.map((x) => convertCustomLineItemModel(x))
          : []
      );

    const customerWithEntityUseCode = await extractEntityUseCode(
      order?.customerId
    );

    const shipppingLineItem = await convertShippingInfoModel(
      order?.shippingInfo,
      order?.shippingCustomFields
    );

    lines.push(shipppingLineItem);

    transaction.date = new Date();

    transaction.code = order?.orderNumber || order.id;

    transaction.commit = params?.commit ?? false;

    transaction.companyCode = transactionManager.companyCode;

    transaction.type = DocumentType.SalesInvoice;

    transaction.currencyCode = order?.totalPrice?.currencyCode;

    transaction.customerCode =
      customerWithEntityUseCode?.customerNumber as string;

    transaction.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    transaction.entityUseCode = customerWithEntityUseCode?.entityUseCode;
    transaction.lines = lines;
  }

  return transaction;
}
