import {
  StagedOrderUpdateAction,
  OrderEditDraft,
  OrderEdit,
} from '@commercetools/platform-sdk';
import { logger } from '../utils/logger.utils';
import { createApiRoot } from './create.client';

export const createOrderEdit = async (
  orderId: string,
  actions: StagedOrderUpdateAction[]
) => {
  try {
    const orderEditDraft: OrderEditDraft = {
      resource: {
        typeId: 'order',
        id: orderId,
      },
      stagedActions: actions,
      key: `edit-${Date.now()}`,
      comment: 'Order edit created via Avalara connector',
    };
    return (
      await createApiRoot()
        .orders()
        .edits()
        .post({ body: orderEditDraft })
        .execute()
    )?.body;
  } catch (e) {
    logger.error(e);
    return undefined;
  }
};

export const applyOrderEdit = async (edit: OrderEdit) => {
  try {
    return (
      await createApiRoot()
        .orders()
        .edits()
        .withId({ ID: edit.id })
        .apply()
        .post({
          body: {
            editVersion: edit.version,
            resourceVersion: edit.resource.obj?.version as number,
          },
        })
        .execute()
    )?.body;
  } catch (e) {
    logger.error(e);
    return undefined;
  }
};
