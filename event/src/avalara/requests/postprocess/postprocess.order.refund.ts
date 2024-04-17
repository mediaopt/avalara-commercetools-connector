import { OrderSetCustomTypeAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { performOrderUpdateActions } from '../../../client/data.client';
import { logger } from '../../../utils/logger.utils';

export async function postProcessing(
  orderId: string,
  orderVersion: number,
  transaction: TransactionModel | undefined
) {
  if (!transaction) {
    return;
  }
  const actions: Array<OrderSetCustomTypeAction> = [];

  if (transaction.invoiceMessages) {
    actions.push({
      action: 'setCustomType',
      type: {
        id: 'invoices-messages',
        typeId: 'type',
      },
      fields: { invoiceMessages: transaction.invoiceMessages },
    } as OrderSetCustomTypeAction);
  }
  await performOrderUpdateActions(orderId, orderVersion, actions).catch(
    (error) => logger.error(error)
  );
}
