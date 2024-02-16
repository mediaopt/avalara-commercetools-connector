import {
  OrderSetCustomTypeAction,
  OrderSetLineItemCustomTypeAction,
} from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { performOrderUpdateActions } from '../../../client/data.client';
import { logger } from '../../../utils/logger.utils';

function buildCustomTypeAction(
  action: string,
  customTypeId: string,
  fields: object
) {
  return {
    action,
    type: {
      id: customTypeId,
      typeId: 'type',
    },
    fields,
  };
}

export async function postProcessing(
  orderId: string,
  orderVersion: number,
  transaction: TransactionModel | undefined
) {
  if (!transaction) {
    return;
  }
  const actions: Array<
    OrderSetLineItemCustomTypeAction | OrderSetCustomTypeAction
  > = [];

  for (const item of transaction?.lines || []) {
    actions.push({
      ...buildCustomTypeAction('setLineItemCustomType', 'vat-code', {
        vatCode: item.vatCode,
      }),
      lineItemId: item.itemCode,
    } as OrderSetLineItemCustomTypeAction);
  }

  if (transaction.invoiceMessages) {
    actions.push({
      ...buildCustomTypeAction('setCustomType', 'invoices-messages', {
        invoiceMessages: transaction.invoiceMessages,
      }),
    } as OrderSetCustomTypeAction);
  }
  await performOrderUpdateActions(orderId, orderVersion, actions).catch(
    (error) => logger.error(error)
  );
}
