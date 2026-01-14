import { Order } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { logger } from '../utils/logger.utils';
import { applyOrderEdit, createOrderEdit } from '../client/post.client';
import { buildOrderEditUpdateActions } from '@mediaopt/avalara-commercetools-lib';

export async function createAndApplyOrderEdit(
  transactionModel: TransactionModel,
  order: Order
): Promise<boolean> {
  const orderId = order.id;
  const orderEdit = await createOrderEdit(
    orderId,
    buildOrderEditUpdateActions(transactionModel, order)
  );
  if (!orderEdit) {
    logger.error(
      `No order edit found. Failed to create order edit for order ${orderId} after recalculating transaction`
    );
    return false;
  }
  const result = (await applyOrderEdit(orderEdit))?.result;
  if (!result) {
    logger.error(
      `Failed to apply order edit for order ${orderId} after recalculating transaction`
    );
    return false;
  }
  if (result.type == 'Applied') {
    logger.info(`Order edit applied successfully for order ${orderId}`);
    return true;
  } else {
    logger.error(
      `Order edit ${orderEdit.id} not applied for order ${orderId} with result: ${result.type}`
    );
    return false;
  }
}
