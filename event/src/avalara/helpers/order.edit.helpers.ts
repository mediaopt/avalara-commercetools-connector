import { Order, StagedOrderUpdateAction } from '@commercetools/platform-sdk';
import { TransactionModel } from 'avatax/lib/models/TransactionModel';
import { logger } from '../../utils/logger.utils';
import { applyOrderEdit, createOrderEdit } from '../../client/post.client';
import { TransactionSummary } from 'avatax/lib/models/TransactionSummary';

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

export function buildOrderEditUpdateActions(
  transactionModel: TransactionModel,
  order: Order
): StagedOrderUpdateAction[] {
  const actions = [] as StagedOrderUpdateAction[];

  if (order.taxMode !== 'ExternalAmount') {
    actions.push({ action: 'changeTaxMode', taxMode: 'ExternalAmount' });
  }

  const country = (order?.country || order?.shippingAddress?.country) as string;

  const rate = (rateSummaryElement: TransactionSummary) => {
    const taxable = rateSummaryElement.taxable as number;
    const nonTaxable = rateSummaryElement.nonTaxable as number;
    const taxCalculated = rateSummaryElement.taxCalculated as number;

    // No taxable amount => tax rate is 0
    if (taxable == 0) {
      return 0;
    }

    // No non-taxable amount => tax rate is full rate
    if (nonTaxable == 0) {
      return rateSummaryElement.rate as number;
    }

    // Mixed taxable and non-taxable amounts => calculate effective tax rate
    const totalAmount = taxable + nonTaxable;
    return Math.round((10000 * taxCalculated) / totalAmount) / 10000;
  };

  const taxRate = transactionModel.summary
    ?.map((x) => rate(x))
    .reduce((acc, curr) => (acc || 0) + (curr || 0), 0);

  let totalTax = 0;

  const lines: any = transactionModel?.lines;

  for (const item of order.lineItems || []) {
    const taxCentAmount =
      lines.find((x: any) => x.itemCode === item?.variant?.sku)?.tax * 100;

    totalTax += taxCentAmount;

    actions.push({
      action: 'setLineItemTaxAmount',
      lineItemId: item.id,
      externalTaxAmount: {
        totalGross: {
          currencyCode: order?.totalPrice?.currencyCode,
          centAmount: item?.totalPrice?.centAmount + taxCentAmount,
        },
        taxRate: {
          name: 'avaTaxRate',
          amount: taxCentAmount ? taxRate : 0,
          country,
        },
      },
    });
  }

  for (const item of order?.customLineItems || []) {
    const taxCentAmount =
      lines.find((x: any) => x.itemCode === item?.key)?.tax * 100;

    totalTax += taxCentAmount;

    actions.push({
      action: 'setCustomLineItemTaxAmount',
      customLineItemId: item.id,
      externalTaxAmount: {
        totalGross: {
          currencyCode: order?.totalPrice?.currencyCode,
          centAmount: item?.totalPrice?.centAmount + taxCentAmount,
        },
        taxRate: {
          name: 'avaTaxRate',
          amount: taxCentAmount ? taxRate : 0,
          country,
        },
      },
    });
  }

  const shipTaxCentAmount =
    lines.find((x: any) => x.itemCode === 'Shipping')?.tax * 100;

  const shipPrice =
    order?.shippingInfo?.discountedPrice?.value?.centAmount ??
    (order?.shippingInfo?.price?.centAmount as number);
  totalTax += shipTaxCentAmount;

  actions.push({
    action: 'setShippingMethodTaxAmount',
    shippingKey: order?.shippingKey,
    externalTaxAmount: {
      totalGross: {
        centAmount: shipPrice + shipTaxCentAmount,
        currencyCode: order?.totalPrice?.currencyCode,
      },
      taxRate: {
        name: 'avaTaxRate',
        amount: shipTaxCentAmount ? taxRate : 0,
        country,
      },
    },
  });

  actions.push({
    action: 'setOrderTotalTax',
    externalTotalGross: {
      currencyCode: order?.totalPrice?.currencyCode,
      centAmount: order?.totalPrice?.centAmount + totalTax, // minus total order discount gross
    },
  });

  return actions;
}
