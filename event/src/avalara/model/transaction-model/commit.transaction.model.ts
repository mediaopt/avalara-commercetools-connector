import { Order } from '@commercetools/platform-sdk';
import { extractTaxCodesFromCategories } from '../../helpers/tax.code.helpers';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';
import { AvataxTransactionManager } from '../..';
import { DocumentType } from 'avatax/lib/enums/DocumentType';
import { extractEntityUseCode } from '../../helpers/entity.use.code.helpers';
import { convertShippingAddressModel } from '../shipping.address.model';
import { convertLineItemModel } from '../line-item-model/line.item.model';
import { convertCustomLineItemModel } from '../line-item-model/custom.line.item.model';
import { convertShippingInfoModel } from '../line-item-model/shipping.info.model';

// initialize and specify the tax document model of Avalara
export async function commitTransactionModel(
  order: Order,
  transactionManager: AvataxTransactionManager
): Promise<CreateOrAdjustTransactionModel> {
  let transaction = new CreateOrAdjustTransactionModel();

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

    transaction.createTransactionModel = new CreateTransactionModel();

    transaction.createTransactionModel.date = new Date();

    transaction.createTransactionModel.code = order?.orderNumber || order.id;

    transaction.createTransactionModel.commit = true;

    transaction.createTransactionModel.companyCode =
      transactionManager.companyCode;

    transaction.createTransactionModel.type = DocumentType.SalesInvoice;

    transaction.createTransactionModel.currencyCode =
      order?.totalPrice?.currencyCode;

    transaction.createTransactionModel.customerCode =
      customerWithEntityUseCode?.customerNumber as string;

    transaction.createTransactionModel.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    transaction.createTransactionModel.entityUseCode =
      customerWithEntityUseCode?.entityUseCode;
    transaction.createTransactionModel.lines = lines;
  }

  return transaction;
}
