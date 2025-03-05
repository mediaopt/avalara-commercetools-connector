import { CustomLineItem, LineItem, Order } from '@commercetools/platform-sdk';
import { getCustomerEntityUseCode } from '../../../client/data.client';
import { lineItem } from '../../utils/line.items';
import { shippingAddress } from '../../utils/shipping.address';
import { shipItem } from '../../utils/shipping.info';
import { AddressInfo } from 'avatax/lib/models/AddressInfo';
import { getCategoryTaxCodes } from './get.categories';
import { customLineItem } from '../../utils/custom.line.items';
import { CreateOrAdjustTransactionModel } from 'avatax/lib/models/CreateOrAdjustTransactionModel';
import { CreateTransactionModel } from 'avatax/lib/models/CreateTransactionModel';

// initialize and specify the tax document model of Avalara
export async function processOrder(
  type: string,
  order: Order,
  companyCode: string,
  originAddress: AddressInfo
): Promise<CreateOrAdjustTransactionModel> {
  let transaction = new CreateOrAdjustTransactionModel();

  if (order?.shippingAddress && order?.shippingInfo) {
    const shipFrom = originAddress;

    const shipTo = shippingAddress(order?.shippingAddress);

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

    if (type === 'commit') {
      const shippingCustomFields = order?.shippingCustomFields;

      const shippingInfo = await shipItem(
        type,
        order?.shippingInfo,
        shippingCustomFields
      );

      lines.push(shippingInfo);
    }

    transaction.createTransactionModel = new CreateTransactionModel();

    transaction.createTransactionModel.date = new Date();

    transaction.createTransactionModel.code = order?.orderNumber || order.id;

    transaction.createTransactionModel.commit = true;

    transaction.createTransactionModel.companyCode = companyCode;

    transaction.createTransactionModel.type = type === 'refund' ? 5 : 1;

    transaction.createTransactionModel.currencyCode =
      order?.totalPrice?.currencyCode;

    transaction.createTransactionModel.customerCode =
      customerInfo?.customerNumber as string;

    transaction.createTransactionModel.addresses = {
      shipFrom: shipFrom,
      shipTo: shipTo,
    };
    transaction.createTransactionModel.entityUseCode = customerInfo?.exemptCode;
    transaction.createTransactionModel.lines = lines;
  }

  return transaction;
}
